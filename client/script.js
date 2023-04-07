import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const messageWrapper = document.querySelector('#message_wrapper');

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

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}


function scrollIntoView(element, behavior = 'smooth', block = 'start') {
  element.scrollIntoView({
    behavior,
    block,
  });
}

function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi && 'ai'}">
      <div class="chat">
        <div class="profile">
          <img src=${isAi ? bot : user} alt="${isAi ? 'bot' : 'user'}"/>
        </div>
        <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>
  `;
}


function typeText(element, text, typingSpeed = 20, callback) {
  element.scrollTop = 0;
  let index = 0;
  let requestId;

  function animate() {
    requestId = requestAnimationFrame(animate);

    if (index < text.length) {
      element.insertAdjacentHTML('beforeend', text.charAt(index));
      index++;

      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        element.scrollTop = element.scrollHeight;
      }
    } else {
      cancelAnimationFrame(requestId);

      const isElementAtBottom = element.scrollHeight - element.clientHeight <= element.scrollTop + 1;

      if (isElementAtBottom) {
        setTimeout(() => {
          const messageDiv = element.lastChild;
          messageDiv.scrollIntoView();
        }, 100);
      }

      setTimeout(() => callback && callback(), text.length * typingSpeed);
    }
  }

  requestId = requestAnimationFrame(animate);
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const messages = JSON.parse(localStorage.getItem('messages')) || [];

  const userMessage = chatBubble(false, data.get('prompt'));
  messageWrapper.insertAdjacentHTML('beforeend', userMessage);
  form.reset();

  const uniqueId = generateUniqueId();
  const botMessage = chatBubble(true, '', uniqueId);
  messageWrapper.insertAdjacentHTML('beforeend', botMessage);

  const messageDiv = document.getElementById(uniqueId);
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
      typeText(messageDiv, parsedData, () => {
        const previousMessageDivsHeight = Array.from(messageWrapper.children).reduce((acc, cur) => acc + cur.offsetHeight, 0);
        chatContainer.scrollTop = previousMessageDivsHeight - chatContainer.offsetHeight;
        scrollIntoView(messageDiv);

        messages.push({ isBot: true, message: parsedData });
        localStorage.setItem('messages', JSON.stringify(messages));
      });
    } else {
      const err = await response.text();
      throw new Error(`Error ${response.status}: ${err}`);
    }
  } catch (err) {
    messageDiv.innerHTML = err.message;
    console.error(err);
  }

  messages.push({ isBot: false, message: data.get('prompt') });
  localStorage.setItem('messages', JSON.stringify(messages));
};




form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});

