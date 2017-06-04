#!/bin/bash

while true; do
    cd .. && clear && npm start

    echo ""
    echo "The application has been stopped, and will restart in 5 seconds."
    echo "Press Ctrl+C to interrupt the process."
    sleep 5
done