package ui

type State int

const (
	StateLoading    State = iota // Cargando info inicial
	StateDashboard               // Pantalla principal
	StateOutOfSync               // Versiones desincronizadas — error
	StateBumpSelect              // Seleccionando patch/minor/major
	StateConfirm                 // Preview de cambios
	StateReleaseNotes            // Ver commits desde último tag
	StateProgress                // Ejecutando operaciones
	StateSuccess                 // Release completado
	StateError                   // Error con rollback info
)

type Step int

const (
	StepWritePackageJSON Step = iota
	StepWriteTauriConf
	StepWriteCargoToml
	StepGitAdd
	StepGitCommit
	StepGitTagT1
	StepGitTagT2
	StepGitPushBranch
	StepGitPushT1
	StepGitPushT2
)

type StepStatus int

const (
	StepPending StepStatus = iota
	StepRunning
	StepDone
	StepFailed
	StepSkipped
)

type StepState struct {
	Step   Step
	Label  string
	Status StepStatus
	Err    error
}
