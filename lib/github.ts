import { Octokit } from '@octokit/rest';

export async function backupToGitHub({
  fileName,
  fileBuffer,
  jsonData,
}: {
  fileName: string;
  fileBuffer?: Buffer;
  jsonData?: any;
}) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'bongkeun-choi';
  const repo = process.env.GITHUB_REPO || 'jungwon';

  if (!token) {
    console.log('[GitHub Backup] GITHUB_TOKEN is not configured. Skipping remote backup.');
    return { success: false, reason: 'GITHUB_TOKEN_MISSING' };
  }

  const octokit = new Octokit({ auth: token });
  const dateStr = new Date().toISOString().slice(0, 10);
  const results: any = {};

  try {
    // 1. 엑셀 파일 백업
    if (fileBuffer) {
      const excelPath = `backups/${dateStr}_${fileName}`;
      let existingSha: string | undefined;

      try {
        const { data: existingFile } = await octokit.repos.getContent({
          owner,
          repo,
          path: excelPath,
        });
        if (!Array.isArray(existingFile) && 'sha' in existingFile) {
          existingSha = existingFile.sha;
        }
      } catch {
        // 새 파일인 경우 에러 무시
      }

      const res = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: excelPath,
        message: `backup: Excel file upload - ${fileName} (${dateStr})`,
        content: fileBuffer.toString('base64'),
        sha: existingSha,
      });
      results.excel = res.data;
    }

    // 2. JSON 데이터 백업
    if (jsonData) {
      const jsonPath = `data/monthly_latest.json`;
      let existingJsonSha: string | undefined;

      try {
        const { data: existingJsonFile } = await octokit.repos.getContent({
          owner,
          repo,
          path: jsonPath,
        });
        if (!Array.isArray(existingJsonFile) && 'sha' in existingJsonFile) {
          existingJsonSha = existingJsonFile.sha;
        }
      } catch {
        // 새 파일
      }

      const jsonRes = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: jsonPath,
        message: `data: update monthly records (${dateStr})`,
        content: Buffer.from(JSON.stringify(jsonData, null, 2)).toString('base64'),
        sha: existingJsonSha,
      });
      results.json = jsonRes.data;
    }

    return { success: true, results };
  } catch (error: any) {
    console.error('[GitHub Backup Error]', error?.message || error);
    return { success: false, error: error?.message };
  }
}
