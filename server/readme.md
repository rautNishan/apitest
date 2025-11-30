## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd <project-name>
```

2. **Setup environment variables**
```bash
cp .env.example .env
```

3. **Build and start services**
```bash
docker compose build
docker compose up
```

4. **Server ready!** 🎉
```
API: http://localhost:3000
Database: PostgreSQL on port 5432
Redis: port 6379
```

---

## 📡 API Endpoints

### 1. Search Orders
```http
GET /api/orders?search={query}
```

**Description:** Search orders using full-text search on order items.

**Query Parameters:**
- `search` (optional) - Search term for order items
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)



### 2. Search Orders (Partitioned Table)
```http
GET /api/order-massive?search={query}
```

**Description:** Same as `/api/orders` but queries the partitioned table for optimized read performance on large datasets.

**Query Parameters:** Same as `/api/orders`

---

### 3. Get Order Statistics
```http
GET /api/orders/stats
```

**Description:** Get aggregated order statistics across all time.

---

### 4. Get Order by ID
```http
GET /api/orders/:id
```

**Description:** Retrieve a specific order by UUID.


### 5. Create Single Order
```http
POST /api/order
```

**Description:** Create a single order (synchronous).

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174001",
  "status": "pending",
  "subtotal": 150.00,
  "totalAmount": 165.00,
  "discountAmount": 15.00,
  "paymentMethod": "card",
  "paymentStatus": "pending",
  "orderItemText": "Laptop, Mouse, Keyboard",
  "date": "2025-11-30"
}
```

---

### 6. Bulk Create Orders (Async)
```http
POST /api/orders
```

**Description:** Create multiple orders asynchronously. Returns immediately with a job ID for tracking.

**Request Body:**
```json
{
  "orders": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174001",
      "status": "pending",
      "subtotal": 150.00,
      "totalAmount": 165.00,
      "discountAmount": 15.00,
      "paymentMethod": "card",
      "paymentStatus": "pending",
      "orderItemText": "Laptop, Mouse, Keyboard",
      "date": "2025-11-30"
    },
    {
      "userId": "123e4567-e89b-12d3-a456-426614174002",
      "status": "pending",
      "subtotal": 89.99,
      "totalAmount": 95.99,
      "discountAmount": 5.00,
      "paymentMethod": "card",
      "paymentStatus": "pending",
      "orderItemText": "Phone, Case",
      "date": "2025-11-30"
    }
  ]
}
```


**Check Job Status:**
```http
GET /api/orders/bulk/:jobId/status
```



### Database Schema

**Orders Table**
- Stores all order data
- Full-text search index on `order_items_tsv`
- Soft delete support with `deleted_at`

**Orders Massive Table** (Partitioned)
- Mirror of orders table
- Partitioned by date for read optimization


**Order Stats Table**
- Daily aggregated statistics
- Unique constraint on date
- Automatically updated via background jobs


## 🛠️ Development

### Run Locally
```bash
# Install dependencies
pnpm install

# Run migrations
pnpm run migration:run
pnpm run seed:orders
pnpm run seed:orders:massive
pnpm run trigger

# Start development server
pnpm run start:dev
```

### View Logs
```bash
docker compose logs -f api
```

