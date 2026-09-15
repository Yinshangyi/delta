#!/usr/bin/env bash
# Shared by the PostToolUse hooks: read the edited path from the payload on
# stdin, but only for file-editing tools.
edited_file() {
  local payload tool
  payload=$(cat)
  tool=$(printf '%s' "$payload" | jq -r '.tool_name // empty')
  case "$tool" in
    Edit | Write | MultiEdit | NotebookEdit) ;;
    *) return 1 ;;
  esac
  printf '%s' "$payload" | jq -r '.tool_input.file_path // empty'
}

# Inside the project, and one of the given extensions.
in_project() {
  local file=$1 project_dir=$2
  [ -n "$file" ] || return 1
  case "$file" in "$project_dir"/*) ;; *) return 1 ;; esac
  return 0
}
