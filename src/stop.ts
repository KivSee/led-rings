import { stop } from './services/trigger';

const sendStop = async () => {
    await stop();
}

(async () => {
    await sendStop();
})();