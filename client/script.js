const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(form)

    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

    // to clear the textarea input 
    form.reset()

    // bot's chatstripe
    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

    // to focus scroll to the bottom 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // specific message div 
    const messageDiv = document.getElementById(uniqueId)

    // messageDiv.innerHTML = "..."
    loader(messageDiv)

    try {
        const response = await fetch('https://chatgpt-ai-lujs.onrender.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: data.get('prompt')
            })
        })

        clearInterval(loadInterval)
        messageDiv.innerHTML = " "

        if (response.ok) {
            const data = await response.json();
            const parsedData = data.bot.trim() // trims any trailing spaces/'\n' 

            typeText(messageDiv, parsedData)
        } else {
            throw new Error('Something went wrong')
        }
    } catch (err) {
        clearInterval(loadInterval)
        messageDiv.innerHTML = "Something went wrong. Please try again later."
    }
}
