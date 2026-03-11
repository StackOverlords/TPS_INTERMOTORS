package ui

import "github.com/charmbracelet/lipgloss"

var (
	ColorPrimary  = lipgloss.Color("39")  // cyan/azul
	ColorSuccess  = lipgloss.Color("42")  // verde
	ColorError    = lipgloss.Color("196") // rojo
	ColorWarning  = lipgloss.Color("214") // naranja
	ColorMuted    = lipgloss.Color("241") // gris
	ColorSelected = lipgloss.Color("205") // pink/magenta

	StyleTitle = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary).
			BorderStyle(lipgloss.RoundedBorder()).
			BorderForeground(ColorPrimary).
			Padding(0, 2)

	StyleSection = lipgloss.NewStyle().
			BorderStyle(lipgloss.NormalBorder()).
			BorderForeground(ColorMuted).
			Padding(0, 1)

	StyleSuccess = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorSuccess)

	StyleError = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorError)

	StyleWarning = lipgloss.NewStyle().
			Foreground(ColorWarning)

	StyleMuted = lipgloss.NewStyle().
			Foreground(ColorMuted)

	StyleSelected = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorSelected)

	StyleKey = lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary)
)

func StatusIcon(s StepStatus) string {
	switch s {
	case StepPending:
		return StyleMuted.Render("○")
	case StepRunning:
		return StyleWarning.Render("→")
	case StepDone:
		return StyleSuccess.Render("✓")
	case StepFailed:
		return StyleError.Render("✗")
	case StepSkipped:
		return StyleMuted.Render("–")
	default:
		return " "
	}
}
