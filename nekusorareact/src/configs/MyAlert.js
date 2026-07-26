let _handler = null;

export function registerAlertHandler(handler) {
    _handler = handler;
}

const MyAlert = {
    alert(title, content, buttons) {
        if (!_handler) {
            return Promise.resolve(null);
        }
        return _handler(title, content, buttons);
    },
};

export default MyAlert;