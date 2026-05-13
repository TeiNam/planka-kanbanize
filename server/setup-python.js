const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VENV_PATH = path.join(__dirname, '.venv');
const REQUIREMENTS_PATH = path.join(__dirname, 'requirements.txt');

const PYTHON_PATH =
  process.platform === 'win32'
    ? path.join(VENV_PATH, 'Scripts', 'python.exe')
    : path.join(VENV_PATH, 'bin', 'python');

const getSystemPythonCommand = () => {
  let result = spawnSync('python3', ['--version'], { stdio: 'ignore' });
  if (result.status === 0) return 'python3';

  result = spawnSync('python', ['--version'], { stdio: 'ignore' });
  if (result.status === 0) return 'python';

  throw new Error('Python is not installed or not in PATH');
};

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status);
};

// venv + apprise가 이미 준비되어 있으면 재설치를 건너뛴다.
// (Docker dev 환경처럼 이미지 빌드 시점에 이미 설치된 경우 매번 npm install 때마다 재생성되지 않도록)
const isVenvReady = () => {
  if (!fs.existsSync(PYTHON_PATH)) return false;

  const check = spawnSync(PYTHON_PATH, ['-c', 'import apprise'], { stdio: 'ignore' });
  return check.status === 0;
};

if (isVenvReady()) {
  process.exit(0);
}

run(getSystemPythonCommand(), ['-m', 'venv', '--copies', VENV_PATH]);
run(PYTHON_PATH, ['-m', 'pip', 'install', '-r', REQUIREMENTS_PATH]);
