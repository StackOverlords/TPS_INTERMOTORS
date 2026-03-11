package ui

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"tps-release/internal/version"
)

// NextStepCmd retorna el Cmd para el siguiente paso pendiente.
// Se llama desde updateProgress() después de cada MsgStepUpdate{Status: StepDone}.
// Cuando todos los pasos están completos, emite MsgExecutionDone{Success: true}.
func NextStepCmd(m Model) tea.Cmd {
	for i, s := range m.steps {
		if s.Status == StepPending {
			return runStepCmd(m, Step(i))
		}
	}
	// Todos los pasos completados → fin
	sha := m.commitSHA
	return func() tea.Msg {
		return MsgExecutionDone{
			Success:   true,
			CommitSHA: sha,
		}
	}
}

// runStepCmd ejecuta el paso indicado y devuelve un Cmd que emite MsgStepUpdate.
func runStepCmd(m Model, step Step) tea.Cmd {
	return func() tea.Msg {
		var err error
		var sha string

		switch step {
		case StepWritePackageJSON:
			err = version.WritePackageJSON(m.paths.PackageJSON, m.newVersion.String())

		case StepWriteTauriConf:
			err = version.WriteTauriConf(m.paths.TauriConf, m.newVersion.String())

		case StepWriteCargoToml:
			err = version.WriteCargoToml(m.paths.CargoToml, m.newVersion.String())

		case StepGitAdd:
			err = m.git.StageFiles([]string{
				m.paths.PackageJSON,
				m.paths.TauriConf,
				m.paths.CargoToml,
			})

		case StepGitCommit:
			err = m.git.Commit(m.newVersion.String())
			if err == nil {
				sha, _ = m.git.GetLastCommitSHA()
			}

		case StepGitTagT1:
			err = m.git.CreateTag(m.newVersion.Tag("t1"))

		case StepGitTagT2:
			err = m.git.CreateTag(m.newVersion.Tag("t2"))

		case StepGitPushBranch:
			_, err = m.git.Run("push", "origin", m.branch)

		case StepGitPushT1:
			_, err = m.git.Run("push", "origin", m.newVersion.Tag("t1"))

		case StepGitPushT2:
			_, err = m.git.Run("push", "origin", m.newVersion.Tag("t2"))
		}

		return MsgStepUpdate{
			Step:   step,
			Status: statusFromErr(err),
			Err:    err,
			SHA:    sha,
		}
	}
}

func statusFromErr(err error) StepStatus {
	if err == nil {
		return StepDone
	}
	return StepFailed
}

// rollback deshace los cambios realizados hasta el paso que falló.
// Retorna la lista de acciones ejecutadas para mostrar al usuario.
func rollback(m Model, failedStep Step) ([]string, error) {
	var actions []string

	newVer := m.newVersion
	t1 := newVer.Tag("t1")
	t2 := newVer.Tag("t2")

	restoreFiles := func() {
		if m.originalPkgJSON != nil {
			if err := os.WriteFile(m.paths.PackageJSON, m.originalPkgJSON, 0644); err == nil {
				actions = append(actions, "Restaurado package.json")
			}
		}
		if m.originalTauriConf != nil {
			if err := os.WriteFile(m.paths.TauriConf, m.originalTauriConf, 0644); err == nil {
				actions = append(actions, "Restaurado tauri.conf.json")
			}
		}
		if m.originalCargoToml != nil {
			if err := os.WriteFile(m.paths.CargoToml, m.originalCargoToml, 0644); err == nil {
				actions = append(actions, "Restaurado Cargo.toml")
			}
		}
	}

	switch {
	case failedStep <= StepGitAdd:
		// Antes del commit — solo restaurar archivos
		restoreFiles()

	case failedStep == StepGitCommit:
		// Commit no se hizo — restaurar archivos
		restoreFiles()

	case failedStep == StepGitTagT1:
		// Commit hecho, ningún tag creado
		if err := m.git.RevertLastCommit(); err == nil {
			actions = append(actions, "git reset HEAD~1 --soft")
		}
		restoreFiles()

	case failedStep == StepGitTagT2:
		// t1 creado, t2 falló
		if err := m.git.DeleteTagLocal(t1); err == nil {
			actions = append(actions, fmt.Sprintf("git tag -d %s", t1))
		}
		if err := m.git.RevertLastCommit(); err == nil {
			actions = append(actions, "git reset HEAD~1 --soft")
		}
		restoreFiles()

	case failedStep >= StepGitPushBranch:
		// Ambos tags creados, push falló
		if err := m.git.DeleteTagLocal(t1); err == nil {
			actions = append(actions, fmt.Sprintf("git tag -d %s", t1))
		}
		if err := m.git.DeleteTagLocal(t2); err == nil {
			actions = append(actions, fmt.Sprintf("git tag -d %s", t2))
		}
		if err := m.git.RevertLastCommit(); err == nil {
			actions = append(actions, "git reset HEAD~1 --soft")
		}
		restoreFiles()
		// Si el push de t1 llegó al remote, intentar borrarlo
		if failedStep >= StepGitPushT2 {
			if err := m.git.DeleteTagRemote("origin", t1); err == nil {
				actions = append(actions, fmt.Sprintf("git push origin --delete %s", t1))
			}
		}
	}

	return actions, nil
}
