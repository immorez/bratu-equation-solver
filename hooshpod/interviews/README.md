### Test Task: Building a Simple RAG-Based Chatbot Assistant

**Introduction:**  
This test task is designed to evaluate your backend development skills with a focus on **performance** (e.g., caching and query optimization), **clean code** (e.g., modular structure, strong typing, and error handling), and **system design** (e.g., scalable architecture and separation of concerns). You need to build a simple chatbot that uses a TXT file as a knowledge source, generates responses based on its content, caches repeated questions, and stores chat history.

**Suggested Completion Time:** 2-3 days (take-home).  
**Output Delivery:** Push the full source code to a public GitHub repository and send us the repo link within 2-3 days. Include a README.md with setup instructions, API examples, and a brief explanation of design decisions (e.g., why Redis for caching, choice of embedding provider).

**Required Technologies:**

- Node.js (version 18+)
- TypeScript
- Express.js (for API endpoints)
- MongoDB (for storing chat history)
- Redis (for caching repeated questions)
- LLM: Use OpenRouter API (with an API key from environment variables; assume a model like `gpt-3.5-turbo` or similar).
- Embeddings: Use Cohere API (via their JS SDK) or Hugging Face Sentence Transformers (via `@xenova/transformers` for on-device inference) to generate embeddings for chunks and queries.

**Important Note:** Do not use advanced libraries like LangGraph, LangChain, or any ready-made RAG frameworks. Implement everything from scratch using standard libraries (e.g., `axios` for HTTP requests, `mongoose` for MongoDB, and `ioredis` for Redis).

**Positive Additions (Optional but Appreciated):**

- Providing Swagger (API documentation) or a simple UI (e.g., basic HTML/JS frontend for testing the chat).
- Adding unit tests (e.g., with Jest).
- Supporting multi-lingual queries (e.g., handling English and Persian inputs seamlessly, perhaps by detecting language in prompts).
- Storing embeddings in a vector database (e.g., ChromaDB via `chromadb-js`) for efficient similarity search.
- Using Docker (e.g., Dockerfile and docker-compose for the app, MongoDB, and Redis).

---

### Core Requirements

The chatbot should expose a simple RESTful API. Assume the TXT file (e.g., `knowledge.txt`) contains raw knowledge text (like a product guide). The bot must:

1. **Load and Process Knowledge Source:**

   - On app startup, read `knowledge.txt` and split it into small chunks (e.g., 200-500 words each) for retrieval.
   - Generate embeddings for each chunk using Cohere API or Hugging Face Sentence Transformers.
   - For retrieval, embed the user's query and perform similarity search (e.g., cosine similarity) to find the top 3 most relevant chunks. Store embeddings in memory initially for simplicity.

2. **Main Chat Endpoint (/chat):**

   - POST `/chat` with body: `{ message: string, userId: string }`
   - Processing steps:
     - Embed the message and retrieve top-3 relevant chunks via cosine similarity.
     - Send a prompt to the LLM: "Based on this text [chunks], answer the question [message]."
     - Return the LLM's response.
   - **Caching with Redis:** If a similar question (based on message hash or embedding similarity >90%) was asked before, fetch from Redis cache and return directly (with TTL e.g., 1 hour).

3. **Store History in MongoDB:**

   - Save each interaction (question + response + timestamp + userId) in a `chats` collection.
   - Simple Schema: `{ userId: string, message: string, response: string, timestamp: Date, sessionId: string }`.
   - Additional Endpoint: GET `/history/:userId` to fetch a user's history (with pagination if needed).

4. **Basic Error Handling and Security:**
   - Handle API errors (e.g., invalid OpenRouter/Cohere API keys or Redis/MongoDB connection issues).
   - Simple rate limiting for `/chat` (e.g., using `express-rate-limit`).
   - Input validation with `zod` or similar.

**Sample API Request:**

```json
POST /chat
{
  "message": "How do I install the product?",
  "userId": "user123"
}
```

**Sample Response:**

```json
{
  "response": "Based on the guide: First, download the file from the site and...",
  "cached": false,
  "timestamp": "2025-10-18T10:00:00Z"
}
```

---

### Bonus Points

These evaluate depth in performance, clean code, and system design. Implement any you can and explain in README (why? how? impact?). Each is worth 1-2 points out of 10 total, unless noted.

| Bonus Item                            | Description                                                                                                                                                                                                          | Suggested Points           | Evaluation Tie-In                                                                                                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Optimized Retrieval**               | Use an efficient similarity search (e.g., FAISS-like indexing in memory) for embeddings. Avoid naive loops.                                                                                                          | 1 point                    | Performance: Shows understanding of indexing and O(n) vs O(log n).                                                                                                                        |
| **LLM Context Window Management**     | Combine chunks efficiently to avoid prompt overflow (e.g., max 4k tokens).                                                                                                                                           | 1 point                    | Performance: Controls LLM cost and speed.                                                                                                                                                 |
| **Handling History Context in Chats** | **In `/chat`, fetch the last 5-10 messages from the user's MongoDB history and append to the LLM prompt (e.g., "History: [history]. Now respond to [message].") for contextual chats. Use sessionId for threading.** | **3 points (high value!)** | **System Design: Demonstrates stateful conversation handling and scalability (e.g., limiting history to avoid high costs). This is a key area—strong implementation earns extra credit.** |
| **Async/Await and Parallelism**       | Make all I/O operations (MongoDB, Redis, OpenRouter, Cohere/HF) async and use Promise.all for parallel tasks like embedding/retrieval.                                                                               | 1 point                    | Performance: Reduces latency.                                                                                                                                                             |
| **Logging and Monitoring**            | Use `winston` or similar to log metrics (e.g., response time, cache hit rate, embedding latency).                                                                                                                    | 1 point                    | Clean Code: Adds observability to system design.                                                                                                                                          |
| **Vector DB Integration**             | Store and query embeddings using a vector database like ChromaDB for scalable retrieval.                                                                                                                             | 2 points                   | System Design: Handles growth in knowledge base size.                                                                                                                                     |
| **Dockerization**                     | Wrap the app in a Dockerfile and set up docker-compose for MongoDB/Redis (and ChromaDB if used).                                                                                                                     | 1 point                    | System Design: Makes it deployment-ready.                                                                                                                                                 |
| **Unit Tests**                        | Achieve at least 70% coverage with Jest for endpoints and utils (e.g., embedding/retrieval functions).                                                                                                               | 1 point                    | Clean Code: Improves reliability.                                                                                                                                                         |
| **Swagger/API Docs or Simple UI**     | Integrate Swagger for auto-generated API docs or build a basic frontend for chat testing.                                                                                                                            | 1 point                    | System Design: Enhances usability and documentation.                                                                                                                                      |
| **Multi-Lingual Support**             | Detect and handle multiple languages (e.g., English/Persian) in prompts/responses, leveraging embedding models that support it.                                                                                      | 1 point                    | System Design: Shows real-world adaptability.                                                                                                                                             |

**Total Suggested Score:** 10 points (5 for core, 5 for bonuses).

---

### Interview Evaluation Criteria

- **Performance (30%):** Is latency under 2 seconds? What's the cache hit rate and embedding speed? (Test with tools like Artillery.)
- **Clean Code (30%):** Is the code modular (controllers, services, utils)? Full typing? No duplication?
- **System Design (40%):** Is the architecture scalable (e.g., separation of concerns)? How does it handle growth in data/users? **Especially scrutinize history context handling—does it prevent memory leaks and manage context effectively?**

**Sample knowledge.txt for Testing:**  
Include in your repo:

```
Product XYZ Installation Guide:
Step 1: Download the file from the website.
Step 2: Run in terminal: npm install.
FAQ: How to update? Use git pull.
```

If you have questions, ask! Good luck. 🚀
