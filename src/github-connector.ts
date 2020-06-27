import { getInputs } from './action-inputs';
import { IGithubData, JIRADetails, PullRequestParams } from './types';
import { PullsUpdateParams } from '@octokit/rest';
import { getJIRAIssueKey, getJIRAIssueKeysByCustomRegexp, getPRDescription, shouldUpdatePRDescription } from './utils';
import * as github from '@actions/github';

export class GithubConnector {
  client: github.GitHub;
  githubData: IGithubData;

  constructor() {
    const { GITHUB_TOKEN } = getInputs();

    this.client = new github.GitHub(GITHUB_TOKEN);
    this.githubData = this.getGithubData();
  }

  get headBranch(): string {
    return this.githubData.pullRequest.head.ref;
  }

  getIssueKeyFromTitle(): string | null {
    const { JIRA_PROJECT_KEY, CUSTOM_ISSUE_NUMBER_REGEXP } = getInputs();

    const shouldUseCustomRegexp = !!CUSTOM_ISSUE_NUMBER_REGEXP && !!JIRA_PROJECT_KEY;
    const PRTitle = this.githubData.pullRequest.title;

    if (!PRTitle) {
      console.log(`JIRA issue id is missing in your PR title ${PRTitle}, doing nothing`);
      return null;
    }
    return shouldUseCustomRegexp
      ? getJIRAIssueKeysByCustomRegexp(PRTitle, CUSTOM_ISSUE_NUMBER_REGEXP, JIRA_PROJECT_KEY)
      : getJIRAIssueKey(PRTitle);
  }

  async updatePrDetails(details: JIRADetails) {
    const owner = this.githubData.owner;
    const repo = this.githubData.repository.name;

    const { number: prNumber = 0, body: prBody = '' } = this.githubData.pullRequest;

    if (!shouldUpdatePRDescription(prBody)) {
      return;
    }

    const prData: PullsUpdateParams = {
      owner,
      repo,
      pull_number: prNumber,
      body: getPRDescription(prBody, details),
    };

    return await this.client.pulls.update(prData);
  }

  private getGithubData(): IGithubData {
    const {
      eventName,
      payload: {
        action,
        repository,
        organization: { login: owner },
        pull_request: pullRequest,
      },
    } = github.context;

    console.log({ eventName, action });

    return {
      repository,
      owner,
      pullRequest: pullRequest as PullRequestParams,
    };
  }
}
