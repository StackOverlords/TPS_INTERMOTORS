package version

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

var cargoVersionRegex = regexp.MustCompile(`(?m)^(version\s*=\s*)"[^"]*"`)

func ReadCargoToml(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("leer Cargo.toml: %w", err)
	}
	section, _, err := extractPackageSection(string(data))
	if err != nil {
		return "", err
	}
	matches := cargoVersionRegex.FindStringSubmatch(section)
	if len(matches) < 2 {
		return "", fmt.Errorf("campo 'version' no encontrado en sección [package] de Cargo.toml")
	}
	// matches[0] = 'version = "1.2.13"', matches[1] = 'version = '
	// Extraer solo el valor
	full := matches[0]
	// full es: version = "1.2.13"
	start := strings.Index(full, `"`)
	end := strings.LastIndex(full, `"`)
	if start == end || start < 0 {
		return "", fmt.Errorf("no se pudo extraer versión de Cargo.toml")
	}
	return full[start+1 : end], nil
}

func WriteCargoToml(path, newVersion string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("leer Cargo.toml: %w", err)
	}
	content := string(data)
	section, sectionStart, err := extractPackageSection(content)
	if err != nil {
		return err
	}
	// Determinar fin de sección
	sectionEnd := sectionStart + len(section)

	newSection := cargoVersionRegex.ReplaceAllString(section, `${1}"`+newVersion+`"`)
	newContent := content[:sectionStart] + newSection + content[sectionEnd:]
	return os.WriteFile(path, []byte(newContent), 0644)
}

// extractPackageSection retorna el contenido de la sección [package] y su offset de inicio.
func extractPackageSection(content string) (section string, start int, err error) {
	idx := strings.Index(content, "[package]")
	if idx < 0 {
		return "", 0, fmt.Errorf("sección [package] no encontrada en Cargo.toml")
	}
	start = idx
	rest := content[idx:]
	// Buscar siguiente sección (línea que empieza con '[' pero no es '[package]')
	lines := strings.Split(rest, "\n")
	end := len(rest)
	inPackage := false
	offset := 0
	for _, line := range lines {
		if !inPackage {
			inPackage = true
			offset += len(line) + 1
			continue
		}
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "[") {
			end = offset
			break
		}
		offset += len(line) + 1
	}
	return rest[:end], start, nil
}
