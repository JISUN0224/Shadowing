@echo off
echo ===== GitHub 업로드 명령어 가이드 =====
echo.
echo 1. 먼저 Shadowing 폴더로 이동:
echo cd "C:\Users\jisun\Desktop\MyProjectWeb_doctor\Shadowing"
echo.
echo 2. Git 초기화:
echo git init
echo.
echo 3. 모든 파일 추가:
echo git add .
echo.
echo 4. 첫 번째 커밋:
echo git commit -m "Initial commit: Shadowing practice app with Azure TTS"
echo.
echo 5. GitHub 리포지토리와 연결 (본인의 GitHub 주소로 변경):
echo git remote add origin https://github.com/본인아이디/shadowing-practice.git
echo.
echo 6. 메인 브랜치로 설정:
echo git branch -M main
echo.
echo 7. GitHub에 업로드:
echo git push -u origin main
echo.
echo ===== 실제 명령어를 복사해서 사용하세요 =====
pause