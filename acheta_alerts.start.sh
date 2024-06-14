#!/bin/env bash

cd $HOME
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd $HOME/venv/massa_acheta_alerts
$HOME/.nvm/versions/node/v18.20.3/bin/npm start
