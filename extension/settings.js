// PromptSEONest Settings Script

document.addEventListener('DOMContentLoaded', () => {
  // Load settings
  chrome.storage.local.get(
    ['apiKey', 'apiEndpoint', 'platform', 'autoFill', 'darkMode'],
    (data) => {
      if (data.apiKey) document.getElementById('apiKey').value = data.apiKey;
      if (data.apiEndpoint) document.getElementById('apiEndpoint').value = data.apiEndpoint;
      if (data.platform) document.getElementById('defaultPlatform').value = data.platform;
      if (data.autoFill) document.getElementById('toggleAutoFill').classList.add('active');
      if (data.darkMode) {
        document.getElementById('toggleDark').classList.add('active');
        document.body.classList.add('dark');
      }
    }
  );

  // Toggles
  document.getElementById('toggleAutoFill').addEventListener('click', function () {
    this.classList.toggle('active');
  });
  document.getElementById('toggleDark').addEventListener('click', function () {
    this.classList.toggle('active');
    document.body.classList.toggle('dark');
  });

  // Save
  document.getElementById('btnSave').addEventListener('click', () => {
    const settings = {
      apiKey: document.getElementById('apiKey').value.trim(),
      apiEndpoint: document.getElementById('apiEndpoint').value.trim() || 'https://api.anthropic.com/v1/messages',
      platform: document.getElementById('defaultPlatform').value,
      autoFill: document.getElementById('toggleAutoFill').classList.contains('active'),
      darkMode: document.getElementById('toggleDark').classList.contains('active')
    };
    chrome.storage.local.set(settings, () => {
      const msg = document.getElementById('saveMsg');
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 2000);
    });
  });
});
