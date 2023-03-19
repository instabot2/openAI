import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

function loader(element) {
    element.textContent = '';

    loadInterval = setInterval(() => {
        // Update the text content of the loading indicator
        element.textContent += '.';

        // If the loading indicator has reached three dots, reset it
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

function typeText(element, text) {
    let index = 0;

    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
        } else {
            clearInterval(interval);
        }
    }, 20);
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
    let wrapperClass = "wrapper";
    if (isAi) {
        wrapperClass += " ai";
    }
    let profileImgSrc = user;
    let profileImgAlt = "user";
    if (isAi) {
        profileImgSrc = bot;
        profileImgAlt = "bot";
    }
    return (
        '<div class="' + wrapperClass + '">' +
        '<div class="chat">' +
        '<div class="profile">' +
        '<img src="' + profileImgSrc + '" alt="' + profileImgAlt + '">' +
        '</div>' +
        '<div class="message" id="' + uniqueId + '">' + value + '</div>' +
        '</div>' +
        '</div>'
    );
}

const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData(form);

    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

    // to clear the textarea input 
    form.reset();

    // bot's chatstripe
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

    // to focus scroll to the bottom 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // specific message div 
    const messageDiv = document.getElementById(uniqueId);

    // messageDiv.innerHTML = "..."
    loader(messageDiv);

    try {
        const response = await fetch('https://chatgpt-ai-lujs.onrender.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: data.get('prompt'),
            }),
        });

        clearInterval(loadInterval);
        messageDiv.innerHTML = '';

        if (response.ok) {
            const data = await response.json();
            const parsedData = data.bot.trim(); // trims any trailing spaces/'\n' 

            typeText(messageDiv, parsedData);
        } else {
            let errorMessage = '';

            switch (response.status) {
                case 400:
                    errorMessage = 'Bad Request';
                    break;
                case 401:
                    errorMessage = 'Unauthorized';
                    break;
                case 404:
                    errorMessage = 'Not Found';
                    break;
                case 500:
                    errorMessage = 'Internal Server Error';
                    break;
                default:
                    errorMessage = 'Something went wrong';
                    break;
            }

            throw new Error(errorMessage);
        }
    } catch (err) {
        messageDiv.innerHTML = `Error: ${err.message}`;
    }
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        handleSubmit(e);
    }
});
