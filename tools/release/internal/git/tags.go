package git

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

func (r *Runner) LatestTag() (string, error) {
	out, err := r.Run("describe", "--tags", "--abbrev=0")
	if err != nil {
		// No hay tags — retornar vacío sin error
		return "", nil
	}
	return out, nil
}

func (r *Runner) CommitsSinceTag(tag string) ([]string, error) {
	var args []string
	if tag == "" {
		args = []string{"log", "--pretty=format:%h %s", "--no-merges"}
	} else {
		args = []string{"log", tag + "..HEAD", "--pretty=format:%h %s", "--no-merges"}
	}
	out, err := r.Run(args...)
	if err != nil {
		return nil, err
	}
	if out == "" {
		return []string{}, nil
	}
	lines := strings.Split(out, "\n")
	result := make([]string, 0, len(lines))
	for _, l := range lines {
		if strings.TrimSpace(l) != "" {
			result = append(result, l)
		}
	}
	return result, nil
}

func (r *Runner) TagExistsLocal(tag string) (bool, error) {
	out, err := r.Run("tag", "-l", tag)
	if err != nil {
		return false, err
	}
	return strings.TrimSpace(out) == tag, nil
}

func (r *Runner) TagExistsRemote(tag string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "git", "ls-remote", "--tags", "origin", "refs/tags/"+tag)
	cmd.Dir = r.WorkDir
	out, err := cmd.Output()
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return false, fmt.Errorf("timeout verificando tag remoto")
		}
		return false, nil // Si falla, asumimos que no existe
	}
	return strings.Contains(string(out), tag), nil
}
