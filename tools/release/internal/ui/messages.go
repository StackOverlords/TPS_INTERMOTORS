package ui

import tea "github.com/charmbracelet/bubbletea"

// MsgGitInfoLoaded — resultado de cargar info git al iniciar
type MsgGitInfoLoaded struct {
	Branch        string
	LatestTag     string
	RecentCommits []string
	IsDirty       bool
	Err           error
}

// MsgVersionsLoaded — resultado de leer los 3 archivos de versión
type MsgVersionsLoaded struct {
	PackageJSON    string
	TauriConf      string
	CargoToml      string
	RawPackageJSON []byte // contenido original para rollback
	RawTauriConf   []byte
	RawCargoToml   []byte
	Err            error
}

// MsgStepUpdate — actualización de un paso de ejecución
type MsgStepUpdate struct {
	Step   Step
	Status StepStatus
	Err    error
	SHA    string // solo para StepGitCommit cuando Done
}

// MsgExecutionDone — ejecución completa (éxito o error)
type MsgExecutionDone struct {
	Success       bool
	CommitSHA     string
	RollbackSteps []string // pasos de rollback ejecutados (para mostrar en error)
	Err           error
}

// Asegurar que los tipos satisfacen tea.Msg (interface vacía — solo documentativo)
var _ tea.Msg = MsgGitInfoLoaded{}
var _ tea.Msg = MsgVersionsLoaded{}
var _ tea.Msg = MsgStepUpdate{}
var _ tea.Msg = MsgExecutionDone{}
