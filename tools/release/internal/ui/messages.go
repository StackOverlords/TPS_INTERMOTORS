package ui

import tea "github.com/charmbracelet/bubbletea"

// MsgGitInfoLoaded — resultado de cargar info git al iniciar
type MsgGitInfoLoaded struct {
	Branch        string
	LatestTag     string
	RecentCommits []string
	IsDirty       bool
	GHInstalled   bool
	GHVersion     string // vacío si no está instalado
	GitVersion    string
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

// MsgCleanupDetected — resultado de detectar qué tags/release existen para limpiar
type MsgCleanupDetected struct {
	Tags CleanupTagStatus
	Err  error
}

// MsgCleanupStepUpdate — actualización de un paso del cleanup
type MsgCleanupStepUpdate struct {
	Step   Step
	Status StepStatus
	Err    error
}

// MsgCleanupDone — limpieza completada (éxito o error)
type MsgCleanupDone struct {
	Success bool
	Err     error
}

var _ tea.Msg = MsgCleanupDetected{}
var _ tea.Msg = MsgCleanupStepUpdate{}
var _ tea.Msg = MsgCleanupDone{}

// MsgUpdateNotesDone — resultado de actualizar las release notes en GitHub
type MsgUpdateNotesDone struct {
	Success bool
	Err     error
}

var _ tea.Msg = MsgUpdateNotesDone{}
