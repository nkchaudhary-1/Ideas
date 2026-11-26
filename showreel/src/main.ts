import './styles/tokens.css';
import './styles/base.css';
import './styles/stage.css';
import './styles/type.css';
import './styles/beats.css';
import './styles/controls.css';
import { mountReel } from './mount';
import { parseParams } from './params';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app');

const options = parseParams(window.location.search);
const handle = await mountReel(root, options);

// `?debug` and `?capture` expose the player as `window.__reel`, for review, the end-to-end
// check and scripted frame capture. `?capture` changes nothing on screen.
if (options.debug || new URLSearchParams(window.location.search).has('capture')) {
  (window as unknown as { __reel: typeof handle }).__reel = handle;
}
