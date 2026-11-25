// Builds the spec for docs/examples/0042s_cisterna (the "¿Sabías que…?" reel) into work/explainer_cisterna/spec.json,
// so the explainer workflow renders it with the Charon voice and puts it into a release (never posted).
const { execFileSync } = require('child_process'), path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'work', 'explainer_cisterna'); fs.mkdirSync(OUT, { recursive: true });
execFileSync('node', [path.join(ROOT, 'docs/examples/0042s_cisterna.js')], { stdio: 'inherit' });
execFileSync('node', [path.join(ROOT, 'scripts/make.js'), path.join(ROOT, 'docs/examples/0042s_cisterna.json'), OUT, '--style', 'build3d'], { stdio: 'inherit' });
