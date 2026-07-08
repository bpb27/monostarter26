### Install `mise`

```bash
curl https://mise.run | sh
```

Add this to your `.zshrc`

```bash
export PATH="/Users/brendanbrown/.local/bin:$PATH"
eval "$(/Users/$USER/.local/bin/mise activate zsh)"
```

In this directory, run:

```bash
mise trust
mise install
```
