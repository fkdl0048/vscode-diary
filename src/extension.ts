import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Diary extension is now active!');

    let disposable = vscode.commands.registerCommand('vscode-diary.createDiary', async () => {
        try {
            // 설정에서 기본 경로 가져오기
            const config = vscode.workspace.getConfiguration('diary');
            let basePath = config.get<string>('basePath');

            // 기본 경로가 설정되지 않은 경우 사용자에게 물어보기
            if (!basePath) {
                const folderResult = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    title: '일기장 폴더를 선택하세요'
                });

                if (!folderResult) {
                    return;
                }

                basePath = folderResult[0].fsPath;
                await config.update('basePath', basePath, vscode.ConfigurationTarget.Global);
            }

            // 현재 날짜 정보 가져오기
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const weekDay = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

            // 연도별 폴더 생성
            const yearPath = path.join(basePath, String(year));
            if (!fs.existsSync(yearPath)) {
                fs.mkdirSync(yearPath);
            }

            // 월별 폴더 생성
            const monthPath = path.join(yearPath, month);
            if (!fs.existsSync(monthPath)) {
                fs.mkdirSync(monthPath);
            }

            // 파일 이름 생성
            const fileName = `${year}${month}${day}.md`;
            const filePath = path.join(monthPath, fileName);

            // 파일이 이미 존재하는지 확인
            if (fs.existsSync(filePath)) {
                const result = await vscode.window.showWarningMessage(
                    '오늘의 일기가 이미 존재합니다. 새로 작성하시겠습니까?',
                    '예', '아니오'
                );
                if (result !== '예') {
                    // 기존 파일 열기
                    const doc = await vscode.workspace.openTextDocument(filePath);
                    await vscode.window.showTextDocument(doc);
                    return;
                }
            }

            // 일기 템플릿 생성
            const template = `# ${year}년 ${month}월 ${day}일 (${weekDay})

## 날씨
- 

## 기분
- 

## 오늘 있었던 일
- 

## 감사한 일
- 

## 내일 할 일
- 

## 생각 정리
`;

            // 파일 생성 및 저장
            fs.writeFileSync(filePath, template);

            // 새로 생성된 파일 열기
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage('오늘의 일기가 생성되었습니다! 🎉');
        } catch (error) {
            vscode.window.showErrorMessage('일기 생성 중 오류가 발생했습니다: ' + error);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}