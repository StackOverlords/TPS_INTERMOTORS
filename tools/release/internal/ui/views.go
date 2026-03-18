package ui

import (
	"fmt"
	"os/exec"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"tps-release/internal/version"
)

func viewLoading() string {
	return "\n  " + StyleMuted.Render("Cargando información del repositorio...") + "\n"
}

func viewDashboard(m Model) string {
	var b strings.Builder

	b.WriteString("\n")
	b.WriteString("  " + StyleTitle.Render("TPS Release Manager") + "\n\n")

	// Info del repo
	b.WriteString(fmt.Sprintf("  Rama actual:  %s\n", StyleKey.Render(m.branch)))
	if m.latestTag != "" {
		b.WriteString(fmt.Sprintf("  Último tag:   %s\n", StyleKey.Render(m.latestTag)))
	} else {
		b.WriteString(fmt.Sprintf("  Último tag:   %s\n", StyleMuted.Render("(ninguno)")))
	}
	b.WriteString("\n")

	// Tabla de versiones
	b.WriteString("  Sincronía de versiones:\n\n")
	rows := []struct{ file, ver string }{
		{"package.json            ", m.versions.PackageJSON},
		{"src-tauri/tauri.conf... ", m.versions.TauriConf},
		{"src-tauri/Cargo.toml   ", m.versions.CargoToml},
	}
	for _, row := range rows {
		icon := StyleSuccess.Render("✓")
		b.WriteString(fmt.Sprintf("    %s  %s  %s\n", icon, StyleMuted.Render(row.file), row.ver))
	}
	b.WriteString("\n")

	// Commits recientes
	count := len(m.recentCommits)
	if count == 0 {
		b.WriteString("  " + StyleMuted.Render("Sin commits nuevos desde el último tag.") + "\n")
	} else {
		b.WriteString(fmt.Sprintf("  Commits desde último tag: %s\n", StyleKey.Render(fmt.Sprintf("%d", count))))
	}
	b.WriteString("\n")

	// Warning working tree sucio
	if m.isDirty {
		b.WriteString("  " + StyleWarning.Render("⚠ Hay cambios sin commitear. El release solo incluirá los archivos de versión.") + "\n\n")
	}

	// Warning si branch != development
	if m.branch != "development" {
		b.WriteString("  " + StyleWarning.Render(fmt.Sprintf("⚠ Estás en '%s', no en 'development'. Los releases se hacen desde 'development'.", m.branch)) + "\n\n")
	}

	// Keybindings
	b.WriteString("  " + StyleKey.Render("[n]") + " Nuevo release    " + StyleKey.Render("[b]") + " Solo bump    " + StyleKey.Render("[c]") + " Cleanup release    " + StyleKey.Render("[q]") + " Salir\n")

	// gh hint si no está instalado
	if !m.ghInstalled {
		b.WriteString("\n  " + StyleWarning.Render("⚠  gh CLI no detectado — instalalo para gestionar GitHub Releases:") + "\n")
		b.WriteString("  " + StyleKey.Render(ghInstallCmd()) + "\n")
	}

	return b.String()
}

// ghInstallCmd detecta el package manager disponible y retorna el comando de instalación de gh.
func ghInstallCmd() string {
	managers := []struct {
		bin string
		cmd string
	}{
		{"dnf", "sudo dnf install gh"},
		{"apt", "sudo apt install gh"},
		{"brew", "brew install gh"},
		{"pacman", "sudo pacman -S github-cli"},
		{"zypper", "sudo zypper install gh"},
	}
	for _, m := range managers {
		if _, err := exec.LookPath(m.bin); err == nil {
			return m.cmd
		}
	}
	return "https://github.com/cli/cli#installation"
}

func viewOutOfSync(m Model) string {
	var b strings.Builder
	b.WriteString("\n")
	b.WriteString("  " + StyleError.Render("✗ ERROR: Versiones desincronizadas") + "\n\n")
	b.WriteString(fmt.Sprintf("    package.json:            %s\n", StyleError.Render(m.versions.PackageJSON)))
	b.WriteString(fmt.Sprintf("    src-tauri/tauri.conf...: %s\n", StyleError.Render(m.versions.TauriConf)))
	b.WriteString(fmt.Sprintf("    src-tauri/Cargo.toml:    %s\n", StyleError.Render(m.versions.CargoToml)))
	b.WriteString("\n")
	b.WriteString("  Sincronizá los 3 archivos manualmente antes de hacer un release.\n\n")
	b.WriteString("  " + StyleKey.Render("[q / Enter]") + " Salir\n")
	return b.String()
}

func viewBumpSelect(m Model) string {
	current := m.versions.Current

	type option struct {
		label, ver, desc string
	}

	var options []option
	if !m.bumpOnlyMode {
		options = []option{
			{"actual", current.String(), "release sin bump adicional"},
			{"patch", current.Bump(version.BumpPatch).String(), "bug fixes, hotfixes"},
			{"minor", current.Bump(version.BumpMinor).String(), "features nuevas, no breaking"},
			{"major", current.Bump(version.BumpMajor).String(), "breaking changes"},
		}
	} else {
		options = []option{
			{"patch", current.Bump(version.BumpPatch).String(), "bug fixes, hotfixes"},
			{"minor", current.Bump(version.BumpMinor).String(), "features nuevas, no breaking"},
			{"major", current.Bump(version.BumpMajor).String(), "breaking changes"},
		}
	}

	var b strings.Builder
	b.WriteString("\n")
	b.WriteString(fmt.Sprintf("  Versión actual: %s\n\n", StyleKey.Render(current.String())))
	b.WriteString("  Seleccioná el tipo de bump:\n\n")

	for i, opt := range options {
		cursor := "  "
		line := ""
		if i == m.bumpCursor {
			cursor = StyleSelected.Render("> ")
			line = StyleSelected.Render(fmt.Sprintf("[●] %-7s → %s", opt.label, opt.ver)) +
				"  " + StyleMuted.Render("("+opt.desc+")")
		} else {
			line = fmt.Sprintf("    [○] %-7s → %s", opt.label, opt.ver) +
				"  " + StyleMuted.Render("("+opt.desc+")")
		}
		b.WriteString(cursor + line + "\n")
	}

	b.WriteString("\n")
	b.WriteString("  " + StyleKey.Render("[↑/↓]") + " Navegar    " +
		StyleKey.Render("[Enter]") + " Confirmar    " +
		StyleKey.Render("[Esc]") + " Volver\n")
	return b.String()
}

func viewConfirm(m Model) string {
	newVer := m.newVersion

	var b strings.Builder
	b.WriteString("\n")
	if m.bumpOnlyMode {
		b.WriteString(fmt.Sprintf("  Preview del bump %s\n", StyleKey.Render("v"+newVer.String())))
	} else {
		b.WriteString(fmt.Sprintf("  Preview del release %s\n", StyleKey.Render("v"+newVer.String())))
	}
	b.WriteString("  " + strings.Repeat("─", 44) + "\n\n")

	if m.noBump {
		b.WriteString("  " + StyleWarning.Render("Sin bump adicional — se usan los archivos tal como están.") + "\n")
	} else {
		b.WriteString("  Archivos que se modificarán:\n")
		b.WriteString(fmt.Sprintf("    package.json               %s → %s\n",
			StyleMuted.Render(m.versions.Current.String()), StyleSuccess.Render(newVer.String())))
		b.WriteString(fmt.Sprintf("    src-tauri/tauri.conf.json  %s → %s\n",
			StyleMuted.Render(m.versions.Current.String()), StyleSuccess.Render(newVer.String())))
		b.WriteString(fmt.Sprintf("    src-tauri/Cargo.toml       %s → %s\n",
			StyleMuted.Render(m.versions.Current.String()), StyleSuccess.Render(newVer.String())))
		b.WriteString("\n  Commit:\n")
		b.WriteString(fmt.Sprintf("    %s\n", StyleKey.Render(fmt.Sprintf("chore(release): bump version to %s", newVer.String()))))
	}

	if !m.bumpOnlyMode {
		t1 := newVer.Tag("t1")
		t2 := newVer.Tag("t2")
		b.WriteString("\n  Tags:\n")
		b.WriteString(fmt.Sprintf("    %s\n", StyleSuccess.Render(t1)))
		b.WriteString(fmt.Sprintf("    %s\n", StyleSuccess.Render(t2)))
	} else {
		b.WriteString("\n  " + StyleWarning.Render("Tags NO se crearán — solo bump y push del branch.") + "\n")
	}

	b.WriteString("\n")
	b.WriteString("  " + StyleKey.Render("[y]") + " Confirmar    " + StyleKey.Render("[n / Esc]") + " Cancelar\n")
	return b.String()
}

func viewReleaseNotes(m Model) string {
	var b strings.Builder
	b.WriteString("\n")
	b.WriteString(fmt.Sprintf("  Release Notes — %s\n", StyleKey.Render("v"+m.newVersion.String())))
	b.WriteString("  " + strings.Repeat("═", 44) + "\n\n")

	if m.latestTag != "" {
		b.WriteString(fmt.Sprintf("  Commits incluidos (desde %s):\n\n", StyleMuted.Render(m.latestTag)))
	} else {
		b.WriteString("  Commits incluidos (primer release — historial completo):\n\n")
	}

	if len(m.recentCommits) == 0 {
		b.WriteString("  " + StyleMuted.Render("(Sin commits nuevos desde el último tag)") + "\n")
	} else {
		for _, c := range m.recentCommits {
			b.WriteString("  • " + c + "\n")
		}
	}

	b.WriteString("\n")
	b.WriteString("  " + StyleKey.Render("[Enter]") + " Continuar con el release    " + StyleKey.Render("[q / Esc]") + " Cancelar\n")
	return b.String()
}

func viewProgress(m Model) string {
	var b strings.Builder
	b.WriteString("\n")
	b.WriteString(fmt.Sprintf("  Ejecutando release %s\n\n", StyleKey.Render("v"+m.newVersion.String())))

	for _, step := range m.steps {
		icon := StatusIcon(step.Status)
		label := step.Label
		if step.Status == StepRunning {
			label = StyleWarning.Render(label)
		} else if step.Status == StepDone {
			label = StyleSuccess.Render(label)
		} else if step.Status == StepFailed {
			label = StyleError.Render(label)
		} else {
			label = StyleMuted.Render(label)
		}
		b.WriteString(fmt.Sprintf("    %s  %s\n", icon, label))
		if step.Status == StepFailed && step.Err != nil {
			b.WriteString(fmt.Sprintf("       %s\n", StyleError.Render(step.Err.Error())))
		}
	}

	b.WriteString("\n  " + StyleMuted.Render("Por favor esperá...") + "\n")
	return b.String()
}

func viewSuccess(m Model) string {
	var b strings.Builder
	b.WriteString("\n")

	label := fmt.Sprintf("✓  Release v%s completado", m.newVersion.String())
	if m.bumpOnlyMode {
		label = fmt.Sprintf("✓  Bump v%s completado", m.newVersion.String())
	}

	successBox := lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorSuccess).
		BorderStyle(lipgloss.RoundedBorder()).
		BorderForeground(ColorSuccess).
		Padding(0, 2).
		Render(label)

	b.WriteString("  " + successBox + "\n\n")

	if m.bumpOnlyMode {
		b.WriteString("  " + StyleWarning.Render("Tags pendientes — cuando estés listo, corré tps-release [n] para crear los tags.") + "\n")
	} else {
		b.WriteString(fmt.Sprintf("  Tags pusheados: %s / %s\n",
			StyleSuccess.Render(m.newVersion.Tag("t1")),
			StyleSuccess.Render(m.newVersion.Tag("t2"))))
	}

	b.WriteString(fmt.Sprintf("  Commit: %s\n",
		StyleKey.Render(fmt.Sprintf("chore(release): bump version to %s", m.newVersion.String()))))
	if m.commitSHA != "" {
		b.WriteString(fmt.Sprintf("  SHA:    %s\n", StyleMuted.Render(m.commitSHA)))
	}
	b.WriteString("\n  " + StyleKey.Render("[q / Enter]") + " Salir\n")
	return b.String()
}

func viewError(m Model) string {
	var b strings.Builder
	b.WriteString("\n")

	errBox := lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorError).
		BorderStyle(lipgloss.RoundedBorder()).
		BorderForeground(ColorError).
		Padding(0, 2).
		Render("✗  Error durante el release")

	b.WriteString("  " + errBox + "\n\n")
	if m.finalErr != nil {
		b.WriteString(fmt.Sprintf("  %s\n\n", StyleError.Render(m.finalErr.Error())))
	}

	if len(m.rollbackSteps) > 0 {
		b.WriteString("  Rollback ejecutado:\n")
		for _, s := range m.rollbackSteps {
			b.WriteString(fmt.Sprintf("    %s  %s\n", StyleSuccess.Render("✓"), StyleMuted.Render(s)))
		}
		b.WriteString("\n  " + StyleSuccess.Render("Estado del repo restaurado.") + "\n")
	}

	b.WriteString("\n  " + StyleKey.Render("[q / Enter]") + " Salir\n")
	return b.String()
}

func viewCleanupProgress(m Model) string {
	var b strings.Builder
	b.WriteString("\n")
	b.WriteString(fmt.Sprintf("  Limpiando tags de %s\n\n", StyleKey.Render("v"+m.versions.Current.String())))

	for _, step := range m.cleanupSteps {
		icon := StatusIcon(step.Status)
		label := step.Label
		if step.Status == StepRunning {
			label = StyleWarning.Render(label)
		} else if step.Status == StepDone {
			label = StyleSuccess.Render(label)
		} else if step.Status == StepFailed {
			label = StyleError.Render(label)
		} else {
			label = StyleMuted.Render(label)
		}
		b.WriteString(fmt.Sprintf("    %s  %s\n", icon, label))
		if step.Status == StepFailed && step.Err != nil {
			b.WriteString(fmt.Sprintf("       %s\n", StyleError.Render(step.Err.Error())))
		}
	}

	b.WriteString("\n  " + StyleMuted.Render("Por favor esperá...") + "\n")
	return b.String()
}

func viewCleanupDetect(m Model) string {
	return "\n  " + StyleMuted.Render(fmt.Sprintf("🔍 Detectando tags de v%s...", m.versions.Current.String())) + "\n"
}

func viewCleanupConfirm(m Model) string {
	ver := m.versions.Current.String()
	t1 := m.versions.Current.Tag("t1")
	t2 := m.versions.Current.Tag("t2")

	var b strings.Builder
	b.WriteString("\n")
	b.WriteString(fmt.Sprintf("  🧹 Cleanup — %s\n", StyleKey.Render("v"+ver)))
	b.WriteString("  " + strings.Repeat("─", 44) + "\n\n")

	found := func(v bool) string {
		if v {
			return StyleSuccess.Render("encontrado")
		}
		return StyleMuted.Render("no encontrado")
	}

	b.WriteString(fmt.Sprintf("    Tag local  %s   %s\n", StyleKey.Render(t1), found(m.cleanupTags.T1Local)))
	b.WriteString(fmt.Sprintf("    Tag local  %s   %s\n", StyleKey.Render(t2), found(m.cleanupTags.T2Local)))
	b.WriteString(fmt.Sprintf("    Tag remote %s   %s\n", StyleKey.Render(t1), found(m.cleanupTags.T1Remote)))
	b.WriteString(fmt.Sprintf("    Tag remote %s   %s\n", StyleKey.Render(t2), found(m.cleanupTags.T2Remote)))

	var ghLabel string
	switch {
	case !m.cleanupTags.GHAvailable:
		ghLabel = StyleMuted.Render("gh no instalado")
	case !m.cleanupTags.GHReleaseExists:
		ghLabel = StyleMuted.Render("gh instalado — release no encontrado")
	default:
		ghLabel = StyleSuccess.Render("encontrado — se eliminará")
	}
	b.WriteString(fmt.Sprintf("    GitHub Release          %s\n", ghLabel))

	nothingFound := !m.cleanupTags.T1Local && !m.cleanupTags.T2Local &&
		!m.cleanupTags.T1Remote && !m.cleanupTags.T2Remote && !m.cleanupTags.GHReleaseExists
	if nothingFound {
		b.WriteString("\n  " + StyleWarning.Render("No se encontraron tags para limpiar.") + "\n")
	}

	b.WriteString("\n")
	b.WriteString("  " + StyleKey.Render("[y]") + " Confirmar    " + StyleKey.Render("[n / Esc]") + " Cancelar\n")
	return b.String()
}

func viewCleanupDone(m Model) string {
	var b strings.Builder
	b.WriteString("\n")

	doneBox := lipgloss.NewStyle().
		Bold(true).
		Foreground(ColorSuccess).
		BorderStyle(lipgloss.RoundedBorder()).
		BorderForeground(ColorSuccess).
		Padding(0, 2).
		Render("✅ Cleanup completado")

	b.WriteString("  " + doneBox + "\n\n")

	for _, step := range m.cleanupSteps {
		if step.Status == StepDone {
			b.WriteString(fmt.Sprintf("    %s  %s\n", StyleSuccess.Render("✓"), StyleSuccess.Render(step.Label)))
		}
	}

	b.WriteString("\n  " + StyleKey.Render("[r]") + " Nueva release    " + StyleKey.Render("[q]") + " Salir\n")
	return b.String()
}
