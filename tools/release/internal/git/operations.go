package git

import (
	"fmt"
	"strings"
)

func (r *Runner) CurrentBranch() (string, error) {
	return r.Run("rev-parse", "--abbrev-ref", "HEAD")
}

func (r *Runner) StageFiles(paths []string) error {
	args := append([]string{"add"}, paths...)
	_, err := r.Run(args...)
	return err
}

func (r *Runner) Commit(version string) error {
	msg := fmt.Sprintf("chore(release): bump version to %s", version)
	_, err := r.Run("commit", "-m", msg)
	return err
}

func (r *Runner) CreateTag(tag string) error {
	_, err := r.Run("tag", tag)
	return err
}

func (r *Runner) Push(remote, branch string, tags ...string) error {
	// Push branch
	if _, err := r.Run("push", remote, branch); err != nil {
		return fmt.Errorf("push branch: %w", err)
	}
	// Push cada tag por separado
	for _, tag := range tags {
		if _, err := r.Run("push", remote, tag); err != nil {
			return fmt.Errorf("push tag %s: %w", tag, err)
		}
	}
	return nil
}

func (r *Runner) DeleteTagLocal(tag string) error {
	_, err := r.Run("tag", "-d", tag)
	return err
}

func (r *Runner) DeleteTagRemote(remote, tag string) error {
	_, err := r.Run("push", remote, "--delete", tag)
	return err
}

func (r *Runner) RevertLastCommit() error {
	_, err := r.Run("reset", "HEAD~1", "--soft")
	return err
}

func (r *Runner) RestoreFiles(paths []string) error {
	args := append([]string{"checkout", "--"}, paths...)
	_, err := r.Run(args...)
	return err
}

func (r *Runner) GetLastCommitSHA() (string, error) {
	return r.Run("rev-parse", "--short", "HEAD")
}

func (r *Runner) IsCleanWorkingTree() (bool, error) {
	out, err := r.Run("status", "--porcelain")
	if err != nil {
		return false, err
	}
	return strings.TrimSpace(out) == "", nil
}

func (r *Runner) IsGitRepo() bool {
	_, err := r.Run("rev-parse", "--git-dir")
	return err == nil
}
