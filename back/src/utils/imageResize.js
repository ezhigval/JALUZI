const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_MAX_WIDTH = Number(process.env.PARSER_IMAGE_MAX_WIDTH) || 800;

function hasFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function resizeImageFile(src, dest, maxWidth = DEFAULT_MAX_WIDTH) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (!hasFfmpeg()) {
    fs.copyFileSync(src, dest);
    return { resized: false, reason: 'ffmpeg-missing' };
  }

  try {
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-i', src,
        '-vf', `scale='min(${maxWidth},iw)':-2`,
        '-q:v', '3',
        dest
      ],
      { stdio: 'ignore' }
    );
    return { resized: true };
  } catch (error) {
    fs.copyFileSync(src, dest);
    return { resized: false, reason: error.message };
  }
}

module.exports = {
  DEFAULT_MAX_WIDTH,
  resizeImageFile
};
