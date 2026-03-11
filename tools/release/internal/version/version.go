package version

import (
	"fmt"
	"strconv"
	"strings"
)

type BumpType int

const (
	BumpPatch BumpType = iota
	BumpMinor
	BumpMajor
)

type Version struct {
	Major, Minor, Patch int
}

func Parse(s string) (Version, error) {
	parts := strings.Split(s, ".")
	if len(parts) != 3 {
		return Version{}, fmt.Errorf("versión inválida: %q (esperado X.Y.Z)", s)
	}
	major, e1 := strconv.Atoi(parts[0])
	minor, e2 := strconv.Atoi(parts[1])
	patch, e3 := strconv.Atoi(parts[2])
	if e1 != nil || e2 != nil || e3 != nil {
		return Version{}, fmt.Errorf("versión inválida: %q (los componentes deben ser enteros)", s)
	}
	return Version{major, minor, patch}, nil
}

func (v Version) Bump(t BumpType) Version {
	switch t {
	case BumpMajor:
		return Version{v.Major + 1, 0, 0}
	case BumpMinor:
		return Version{v.Major, v.Minor + 1, 0}
	default:
		return Version{v.Major, v.Minor, v.Patch + 1}
	}
}

func (v Version) String() string {
	return fmt.Sprintf("%d.%d.%d", v.Major, v.Minor, v.Patch)
}

func (v Version) Tag(variant string) string {
	return fmt.Sprintf("v%s-%s", v.String(), variant)
}

type VersionState struct {
	PackageJSON string
	TauriConf   string
	CargoToml   string
	InSync      bool
	Current     Version
}

func Validate(packageJSON, tauriConf, cargoToml string) (VersionState, error) {
	state := VersionState{
		PackageJSON: packageJSON,
		TauriConf:   tauriConf,
		CargoToml:   cargoToml,
	}
	inSync := packageJSON == tauriConf && tauriConf == cargoToml
	state.InSync = inSync
	if inSync {
		v, err := Parse(packageJSON)
		if err != nil {
			return state, err
		}
		state.Current = v
	}
	return state, nil
}
