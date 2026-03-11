package ui

import (
	"fmt"
	"os"
	"path/filepath"

	tea "github.com/charmbracelet/bubbletea"

	"tps-release/internal/git"
	"tps-release/internal/version"
)

type Paths struct {
	RepoRoot    string
	PackageJSON string
	TauriConf   string
	CargoToml   string
}

type Model struct {
	state State
	paths Paths
	git   *git.Runner

	// Git info
	branch        string
	latestTag     string
	recentCommits []string
	isDirty       bool

	// Versiones
	versions   version.VersionState
	newVersion version.Version
	bumpCursor int // 0=patch, 1=minor, 2=major

	// Ejecución
	executing     bool
	steps         []StepState
	commitSHA     string
	rollbackSteps []string

	// Contenidos originales para rollback
	originalPkgJSON  []byte
	originalTauriConf []byte
	originalCargoToml []byte

	// Error final
	finalErr error

	// Terminal size
	width, height int
}

func NewModel(paths Paths) Model {
	g := git.NewRunner(paths.RepoRoot)
	return Model{
		state: StateLoading,
		paths: paths,
		git:   g,
		steps: initSteps(),
	}
}

func initSteps() []StepState {
	return []StepState{
		{Step: StepWritePackageJSON, Label: "Actualizar package.json"},
		{Step: StepWriteTauriConf, Label: "Actualizar tauri.conf.json"},
		{Step: StepWriteCargoToml, Label: "Actualizar Cargo.toml"},
		{Step: StepGitAdd, Label: "git add (archivos de versión)"},
		{Step: StepGitCommit, Label: "git commit"},
		{Step: StepGitTagT1, Label: "git tag -t1"},
		{Step: StepGitTagT2, Label: "git tag -t2"},
		{Step: StepGitPushBranch, Label: "git push origin (branch)"},
		{Step: StepGitPushT1, Label: "git push origin (tag t1)"},
		{Step: StepGitPushT2, Label: "git push origin (tag t2)"},
	}
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(
		loadGitInfoCmd(m.git),
		loadVersionsCmd(m.paths),
	)
}

func loadGitInfoCmd(g *git.Runner) tea.Cmd {
	return func() tea.Msg {
		branch, err := g.CurrentBranch()
		if err != nil {
			return MsgGitInfoLoaded{Err: err}
		}
		latestTag, err := g.LatestTag()
		if err != nil {
			latestTag = ""
		}
		commits, err := g.CommitsSinceTag(latestTag)
		if err != nil {
			commits = []string{}
		}
		isDirty, _ := g.IsCleanWorkingTree()

		return MsgGitInfoLoaded{
			Branch:        branch,
			LatestTag:     latestTag,
			RecentCommits: commits,
			IsDirty:       !isDirty,
		}
	}
}

func loadVersionsCmd(paths Paths) tea.Cmd {
	return func() tea.Msg {
		rawPkg, err := os.ReadFile(paths.PackageJSON)
		if err != nil {
			return MsgVersionsLoaded{Err: fmt.Errorf("package.json: %w", err)}
		}
		rawTauri, err := os.ReadFile(paths.TauriConf)
		if err != nil {
			return MsgVersionsLoaded{Err: fmt.Errorf("tauri.conf.json: %w", err)}
		}
		rawCargo, err := os.ReadFile(paths.CargoToml)
		if err != nil {
			return MsgVersionsLoaded{Err: fmt.Errorf("Cargo.toml: %w", err)}
		}

		pkgVer, err := version.ReadPackageJSON(paths.PackageJSON)
		if err != nil {
			return MsgVersionsLoaded{Err: fmt.Errorf("package.json: %w", err)}
		}
		tauriVer, err := version.ReadTauriConf(paths.TauriConf)
		if err != nil {
			return MsgVersionsLoaded{Err: fmt.Errorf("tauri.conf.json: %w", err)}
		}
		cargoVer, err := version.ReadCargoToml(paths.CargoToml)
		if err != nil {
			return MsgVersionsLoaded{Err: fmt.Errorf("Cargo.toml: %w", err)}
		}

		return MsgVersionsLoaded{
			PackageJSON:    pkgVer,
			TauriConf:      tauriVer,
			CargoToml:      cargoVer,
			RawPackageJSON: rawPkg,
			RawTauriConf:   rawTauri,
			RawCargoToml:   rawCargo,
		}
	}
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case tea.KeyMsg:
		// Ctrl+C bloqueado durante ejecución
		if m.executing {
			return m, nil
		}
		if msg.Type == tea.KeyCtrlC {
			return m, tea.Quit
		}
	}

	// Delegar por estado
	switch m.state {
	case StateLoading:
		return m.updateLoading(msg)
	case StateDashboard:
		return m.updateDashboard(msg)
	case StateOutOfSync:
		return m.updateOutOfSync(msg)
	case StateBumpSelect:
		return m.updateBumpSelect(msg)
	case StateConfirm:
		return m.updateConfirm(msg)
	case StateReleaseNotes:
		return m.updateReleaseNotes(msg)
	case StateProgress:
		return m.updateProgress(msg)
	case StateSuccess, StateError:
		return m.updateResult(msg)
	}
	return m, nil
}

// updateLoading — espera que carguen git info Y versiones
func (m Model) updateLoading(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case MsgGitInfoLoaded:
		if msg.Err != nil {
			m.finalErr = msg.Err
			m.state = StateError
			return m, nil
		}
		m.branch = msg.Branch
		m.latestTag = msg.LatestTag
		m.recentCommits = msg.RecentCommits
		m.isDirty = msg.IsDirty
	case MsgVersionsLoaded:
		if msg.Err != nil {
			m.finalErr = msg.Err
			m.state = StateError
			return m, nil
		}
		state, err := version.Validate(msg.PackageJSON, msg.TauriConf, msg.CargoToml)
		if err != nil {
			m.finalErr = err
			m.state = StateError
			return m, nil
		}
		m.versions = state
		m.originalPkgJSON = msg.RawPackageJSON
		m.originalTauriConf = msg.RawTauriConf
		m.originalCargoToml = msg.RawCargoToml
	}
	// Chequear si cargaron los dos
	if m.branch != "" && m.versions.PackageJSON != "" {
		if !m.versions.InSync {
			m.state = StateOutOfSync
		} else {
			m.state = StateDashboard
		}
	}
	return m, nil
}

func (m Model) updateDashboard(msg tea.Msg) (tea.Model, tea.Cmd) {
	if key, ok := msg.(tea.KeyMsg); ok {
		switch key.String() {
		case "n":
			m.state = StateBumpSelect
		case "q", "ctrl+c":
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m Model) updateOutOfSync(msg tea.Msg) (tea.Model, tea.Cmd) {
	if key, ok := msg.(tea.KeyMsg); ok {
		switch key.String() {
		case "q", "enter", "ctrl+c":
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m Model) updateBumpSelect(msg tea.Msg) (tea.Model, tea.Cmd) {
	if key, ok := msg.(tea.KeyMsg); ok {
		switch key.String() {
		case "up", "k":
			if m.bumpCursor > 0 {
				m.bumpCursor--
			}
		case "down", "j":
			if m.bumpCursor < 2 {
				m.bumpCursor++
			}
		case "enter":
			m.newVersion = m.versions.Current.Bump(version.BumpType(m.bumpCursor))
			// actualizar labels de steps con versión concreta
			t1 := m.newVersion.Tag("t1")
			t2 := m.newVersion.Tag("t2")
			m.steps[5].Label = fmt.Sprintf("git tag %s", t1)
			m.steps[6].Label = fmt.Sprintf("git tag %s", t2)
			m.steps[8].Label = fmt.Sprintf("git push origin %s", t1)
			m.steps[9].Label = fmt.Sprintf("git push origin %s", t2)
			m.state = StateConfirm
		case "esc", "q":
			m.state = StateDashboard
		}
	}
	return m, nil
}

func (m Model) updateConfirm(msg tea.Msg) (tea.Model, tea.Cmd) {
	if key, ok := msg.(tea.KeyMsg); ok {
		switch key.String() {
		case "y":
			m.state = StateReleaseNotes
		case "n", "esc", "q":
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m Model) updateReleaseNotes(msg tea.Msg) (tea.Model, tea.Cmd) {
	if key, ok := msg.(tea.KeyMsg); ok {
		switch key.String() {
		case "enter":
			// Iniciar ejecución
			m.state = StateProgress
			m.executing = true
			return m, startExecutionCmd(m)
		case "q", "esc":
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m Model) updateProgress(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case MsgStepUpdate:
		for i := range m.steps {
			if m.steps[i].Step == msg.Step {
				m.steps[i].Status = msg.Status
				m.steps[i].Err = msg.Err
				if msg.Step == StepGitCommit && msg.Status == StepDone && msg.SHA != "" {
					m.commitSHA = msg.SHA
				}
				break
			}
		}

		if msg.Status == StepFailed {
			rollbackActions, _ := rollback(m, msg.Step)
			m.executing = false
			m.rollbackSteps = rollbackActions
			m.finalErr = fmt.Errorf("falló en '%s': %v", m.steps[msg.Step].Label, msg.Err)
			m.state = StateError
			return m, nil
		}

		// Paso exitoso → siguiente
		return m, NextStepCmd(m)

	case MsgExecutionDone:
		m.executing = false
		if msg.Success {
			m.commitSHA = msg.CommitSHA
			m.state = StateSuccess
		} else {
			m.finalErr = msg.Err
			m.rollbackSteps = msg.RollbackSteps
			m.state = StateError
		}
	}
	return m, nil
}

func (m Model) updateResult(msg tea.Msg) (tea.Model, tea.Cmd) {
	if key, ok := msg.(tea.KeyMsg); ok {
		switch key.String() {
		case "q", "enter":
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m Model) View() string {
	switch m.state {
	case StateLoading:
		return viewLoading()
	case StateDashboard:
		return viewDashboard(m)
	case StateOutOfSync:
		return viewOutOfSync(m)
	case StateBumpSelect:
		return viewBumpSelect(m)
	case StateConfirm:
		return viewConfirm(m)
	case StateReleaseNotes:
		return viewReleaseNotes(m)
	case StateProgress:
		return viewProgress(m)
	case StateSuccess:
		return viewSuccess(m)
	case StateError:
		return viewError(m)
	default:
		return "..."
	}
}

// startExecutionCmd — lanza el primer paso de la ejecución
func startExecutionCmd(m Model) tea.Cmd {
	return runStepCmd(m, StepWritePackageJSON)
}

// getRelFilePath — convierte path absoluto a relativo desde repoRoot (para display)
func getRelFilePath(repoRoot, absPath string) string {
	rel, err := filepath.Rel(repoRoot, absPath)
	if err != nil {
		return absPath
	}
	return rel
}
