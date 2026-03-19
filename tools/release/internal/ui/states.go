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

// Update notes mode — States

const (
	StateUpdateNotes         State = iota + 20
	StateUpdateNotesProgress
	StateUpdateNotesDone
)

// Cleanup mode — States

const (
	StateCleanupDetect   State = iota + 10
	StateCleanupConfirm
	StateCleanupProgress
	StateCleanupDone
)

// Cleanup mode — Steps (base offset 100 to avoid collision with release steps)

type CleanupStep = Step

const (
	cleanupStepBase        = Step(100)
	CleanupStepDeleteLocalT1  CleanupStep = cleanupStepBase + 0
	CleanupStepDeleteLocalT2  CleanupStep = cleanupStepBase + 1
	CleanupStepDeleteRemoteT1 CleanupStep = cleanupStepBase + 2
	CleanupStepDeleteRemoteT2 CleanupStep = cleanupStepBase + 3
	CleanupStepDeleteGHRelease CleanupStep = cleanupStepBase + 4
)

// CleanupTagStatus — resultado de la detección de tags existentes
type CleanupTagStatus struct {
	T1Local        bool
	T1Remote       bool
	T2Local        bool
	T2Remote       bool
	GHAvailable    bool // gh CLI instalado
	GHReleaseExists bool // GitHub Release existe para t1
}
