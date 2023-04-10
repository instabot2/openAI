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

function typeText(element, text, callback) {
  let index = 0;
  const intervalId = setInterval(() => {
    if (index < text.length) {
      element.insertAdjacentHTML('beforeend', text.charAt(index));
      index++;
      // Check if the element is already scrolled to the bottom and scroll it up
      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        element.scrollTop = element.scrollHeight;
      }
    } else {
      clearInterval(intervalId);
      if (callback) {
        callback();
      }
    }
  }, 20);
  // Add this line to clear the text before typing
  element.innerHTML = '';
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


const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // Retrieve stored messages from local storage
  const messages = JSON.parse(localStorage.getItem('messages')) || [];
  
  // Clear existing chat messages
  messageWrapper.innerHTML = '';

  // user's chatstripe
  const userMessage = chatStripe(false, data.get('prompt'));
  messageWrapper.insertAdjacentHTML('beforeend', userMessage);

  // to clear the textarea input
  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  const botMessage = chatStripe(true, '', uniqueId);
  messageWrapper.insertAdjacentHTML('beforeend', botMessage);

  // specific message div
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
      const responseData = await response.json();
      const parsedData = responseData.bot.trim(); // trims any trailing spaces/'\n'
      typeText(messageDiv, parsedData, () => {
        // scroll to the new message
        scrollIntoView(messageDiv);

        // scroll to the top of the chat container to show the new message
        chatContainer.scrollTop = 0;

        // Store the message in local storage
        messages.push({ isBot: true, message: parsedData });
        localStorage.setItem('messages', JSON.stringify(messages));

        // Write the message to an XML file
        const messageXml = `<message isBot="true">${parsedData}</message>`;
        writeMessageToFile(true, messageXml);
        //alert(`XML message stored to computer or android: ${messageXml}`);         
        // add call to writeMessageToFile function
        writeMessageToFile(true, messageXml);
      });
    } else {
      const err = await response.text();
      throw new Error(`Error ${response.status}: ${err}`);
    }
  } catch (err) {
    messageDiv.innerHTML = err.message;
    console.error(err);
  }

  // Store the user's message in local storage
  messages.push({ isBot: false, message: data.get('prompt') });
  localStorage.setItem('messages', JSON.stringify(messages));

  // Summarize previous messages and display
  const previousMessages = messages.filter((message) => !message.isBot).map((message) => message.message);
  const summarizedMessages = await summarizeMessages(previousMessages);
  setSummary(summarizedMessages);

  // Write the message to an XML file
  const messageXml = `<message isBot="false">${data.get('prompt')}</message>`;
  writeMessageToFile(false, messageXml);
  //alert(`XML message stored to computer or android: ${messageXml}`);  
};


const writeMessageToFile = (isBot, messageXml) => {
  // Generate a unique filename based on the current timestamp
  const filename = `${Date.now()}.xml`;
  
  // Check if the platform is Android or not
  if (os.platform() === 'android') {
    // Use the Android-specific filesystem API to write the file
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dir) => {
      dir.getDirectory('chatgpt/messages', { create: true }, (subdir) => {
        subdir.getFile(filename, { create: true }, (fileEntry) => {
          fileEntry.createWriter((fileWriter) => {
            // Write the message XML to the file
            const blob = new Blob([messageXml], { type: 'text/xml' });
            fileWriter.write(blob);
            console.log(`Message written to file: ${fileEntry.nativeURL}`);
          }, (err) => {
            console.error(`Error creating file writer: ${err}`);
          });
        }, (err) => {
          console.error(`Error creating file: ${err}`);
        });
      }, (err) => {
        console.error(`Error creating directory: ${err}`);
      });
    }, (err) => {
      console.error(`Error resolving local filesystem URL: ${err}`);
    });
  } else {
    // Use the generic filesystem API to write the file
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (fs) => {
      fs.root.getDirectory('chatgpt/messages', { create: true }, (dir) => {
        dir.getFile(filename, { create: true }, (fileEntry) => {
          fileEntry.createWriter((fileWriter) => {
            // Write the message XML to the file
            const blob = new Blob([messageXml], { type: 'text/xml' });
            fileWriter.write(blob);
            console.log(`Message written to file: ${fileEntry.nativeURL}`);
          }, (err) => {
            console.error(`Error creating file writer: ${err}`);
          });
        }, (err) => {
          console.error(`Error creating file: ${err}`);
        });
      }, (err) => {
        console.error(`Error creating directory: ${err}`);
      });
    }, (err) => {
      console.error(`Error requesting filesystem: ${err}`);
    });
  }
};






chatContainer.addEventListener('scroll', () => {
  try {
    const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
    if (isAtBottom) {
      //alert('You have reached the end of the chat.');
    }
  } catch (error) {
    console.error('Error checking if at bottom of chat container:', error);
    //alert('Error checking if at bottom of chat container.');
  }
});


window.addEventListener('resize', () => {
  // check if user has scrolled up before resizing
  const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 1;
  // calculate new scroll position after resizing
  const newScrollTop = (chatContainer.scrollHeight - chatContainer.clientHeight) * (chatContainer.scrollTop / (chatContainer.scrollHeight - chatContainer.clientHeight));
  // set chat container height to its current height
  chatContainer.style.height = `${chatContainer.clientHeight}px`;
  // scroll to the bottom of the chat container if user is already at the bottom
  if (isScrolledToBottom) {
    chatContainer.scrollTop = newScrollTop;
    //chatContainer.scrollTop = 0;
  }
  // if user has scrolled up, keep their scroll position after resizing
  else {
    chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight - (1 - (newScrollTop / chatContainer.clientHeight)) * (chatContainer.scrollHeight - chatContainer.clientHeight);
  }
});

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});

