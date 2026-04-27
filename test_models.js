const apiKey = "AIzaSyC6BKjkdMaH96hb38mHsBP-J_aiCoJnqyQ";

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available models:");
    data.models.forEach(model => {
      console.log(`- ${model.name}`);
    });
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

listModels();
