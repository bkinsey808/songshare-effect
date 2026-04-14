# WSL Secret Management: Windows Credential Manager Bridge

This guide explains how to replicate the macOS Keychain experience (`security add-generic-password`) from **WSL** by bridging it to the **Windows Credential Manager**.

## 1. Prerequisites

- **WSL 2** (Ubuntu/Debian/etc.)
- **Python 3.x** and **pip** installed within your WSL environment.

## 2. Install the Backend Bridge

Standard Linux keyrings expect a desktop environment. To allow your headless WSL terminal to talk to the Windows host vault, you must install the `keyring-wincred` provider.

```bash
pip install keyring-wincred
```

## 3. Configure the Keyring Backend

You must explicitly tell the Python `keyring` utility to use the Windows Credential provider as its primary engine.

1. **Create the config directory:**

   ```bash
   mkdir -p ~/.config/python_keyring/
   ```

2. **Create the configuration file:**
   ```bash
   cat <<EOF > ~/.config/python_keyring/keyringrc.cfg
   [backend]
   default-keyring = keyring_wincred.WinCredKeyring
   EOF
   ```

## 4. Usage: Storing and Retrieving Secrets

### **Store a Secret**

The utility will securely prompt you for the "Password" (your token). No characters will appear as you type or paste.

```bash
keyring set secret-token $USER
```

### **Retrieve a Secret**

To verify the value or use it in a script:

```bash
keyring get secret-token $USER
```

## 5. Automation (Shell Profile)

To ensure your environment variables are set automatically, add the following to your `~/.bashrc` or `~/.zshrc`:

```bash
# Pull Artifactory token from Windows Vault via Keyring Bridge
export ARTIFACTORY_AUTH_TOKEN=$(keyring get secret-token $USER)
```

## 6. Managing Secrets via GUI

1. Press the **Windows Key** and type **"Credential Manager"**.
2. Select **Windows Credentials**.
3. Look under **Generic Credentials** for your service name (e.g., `secret-token`).
