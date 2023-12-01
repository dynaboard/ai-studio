#!/bin/bash

mkdir -p resources/llamacpp

git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
git checkout b1593
make

yes | cp ./main ../resources/llamacpp/main
yes | cp ./server ../resources/llamacpp/server
yes | cp ./tokenize ../resources/llamacpp/tokenize

cd ..
rm -rf llama.cpp
