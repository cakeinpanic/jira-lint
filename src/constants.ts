export const HIDDEN_MARKER_END = '<!--hidden-marker-end-->'
export const HIDDEN_MARKER_START = '<!--hidden-marker-start-->'

export const WARNING_MESSAGE_ABOUT_HIDDEN_MARKERS = '<!--do not remove this marker, its needed to replace info when ticket title is updated -->'

export const BOT_BRANCH_PATTERNS: RegExp[] = [/^dependabot/]

export const DEFAULT_BRANCH_PATTERNS: RegExp[] = [/^master$/, /^production$/, /^gh-pages$/]

export const JIRA_REGEX_MATCHER = /([A-Z0-9]{1,10})-(\d+)/g
