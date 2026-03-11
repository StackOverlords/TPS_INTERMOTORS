package main

import (
	"fmt"
	"os"
	"path/filepath"

	tea "github.com/charmbracelet/bubbletea"
	"tps-release/internal/ui"
)

func main() {
	repoRoot, err := findRepoRoot()
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: %v\n", err)
		os.Exit(2)
	}

	paths := ui.Paths{
		RepoRoot:    repoRoot,
		PackageJSON: filepath.Join(repoRoot, "package.json"),
		TauriConf:   filepath.Join(repoRoot, "src-tauri", "tauri.conf.json"),
		CargoToml:   filepath.Join(repoRoot, "src-tauri", "Cargo.toml"),
	}

	m := ui.NewModel(paths)
	p := tea.NewProgram(m, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func findRepoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "package.json")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("no se encontró la raíz del repositorio (buscando package.json)")
		}
		dir = parent
	}
}
