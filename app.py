import streamlit as st
import random
import time
from graph  import agent

st.title("Simple chat")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

if "thread_id" not in st.session_state:
    thread_id = st.query_params.get("thread_id")

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Accept user input
if prompt := st.chat_input("What is up?"):
    # Display user message in chat message container
    with st.chat_message("user"):
        st.markdown(prompt)
    # Add user message to chat history

    st.session_state.messages.append({"role": "user", "content": prompt})

    for chunk in agent.stream({
            "messages": st.session_state.messages,
        },
            {
                "configurable":{
                    "thread_id": thread_id
                }
            },
            stream_mode=[ "messages"]
        ):
        st.write_stream(chunk)