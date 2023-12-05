#!/bin/bash

mkdir -p resources/llamacpp

git clone https://github.com/ggerganov/llama.cpp
pushd llama.cpp
git checkout $(git describe --tags $(git rev-list --tags --max-count=1))
make

yes | cp ./main ../resources/llamacpp/main
yes | cp ./server ../resources/llamacpp/server
yes | cp ./tokenize ../resources/llamacpp/tokenize
yes | cp ./ggml-metal.metal ../resources/llamacpp/ggml-metal.metal

popd
rm -rf llama.cpp
