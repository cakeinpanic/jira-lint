import { JIRALintActionInputs } from './types'
import * as core from '@actions/core'

export const getInputs = (): JIRALintActionInputs => {
  const JIRA_TOKEN: string = core.getInput('jira-token', { required: true })
  const JIRA_BASE_URL: string = core.getInput('jira-base-url', {
    required: true,
  })
  const GITHUB_TOKEN: string = core.getInput('github-token', {
    required: true,
  })
  const BRANCH_IGNORE_PATTERN: string = core.getInput('skip-branches', { required: false }) || ''
  const CUSTOM_ISSUE_NUMBER_REGEXP = core.getInput('custom-issue-number-regexp', { required: false })
  const JIRA_PROJECT_KEY = core.getInput('jira-project-key', {
    required: false,
  })

  return {
    JIRA_TOKEN,
    GITHUB_TOKEN,
    BRANCH_IGNORE_PATTERN,
    JIRA_PROJECT_KEY,
    CUSTOM_ISSUE_NUMBER_REGEXP,
    JIRA_BASE_URL: JIRA_BASE_URL.endsWith('/') ? JIRA_BASE_URL.replace(/\/$/, '') : JIRA_BASE_URL,
  }
}
