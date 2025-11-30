import express, { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { DBConnection } from "./database/connection/database.connection";
import { connectRedis } from "./common/redis/redis.connection";
import { OrderController } from "./modules/orders/controllers/orders.admin.controller";
import { OrdersCreateDto } from "./modules/orders/dtos/orders.create.dto";
import { OrderQueryDto } from "./modules/orders/dtos/orders.query.dto";
import { OrderStatsController } from "./modules/orders-stats/controller/order-stats.controller";
import { OrderMassiveDataController } from "./modules/orders-massive-data/controllers/orders.admin.controller";

export async function main() {
  const app = express();
  const port = 3000;

  app.use(express.json());

  await DBConnection.connection();
  await connectRedis();

  const orderController = new OrderController();
  const statsController = new OrderStatsController();
  const orderMasiveController=new OrderMassiveDataController()
  app.get("/api/orders", async (req: Request, res: Response) => {
    console.log("incoming req");

    const query = plainToInstance(OrderQueryDto, req.query);
    const data = await orderController.getAll(query);
    res.status(200).json(data);
  });

    app.get("/api/orders-massive", async (req: Request, res: Response) => {
    console.log("incoming req");

    const query = plainToInstance(OrderQueryDto, req.query);
    const data = await orderMasiveController.getAll(query);
    res.status(200).json(data);
  });


  app.get("/api/orders/stats", async (req: Request, res: Response) => {
    try {
      const data = await statsController.getAggregatedStats();
      res.status(200).json(data);
    } catch (err) {
      console.error("Error in /api/orders/stats:", err);
      res.status(500).json({ error: "Failed to fetch order statistics" });
    }
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const order = await orderController.getById(id);

      res.status(200).json({
        data: order,
      });
    } catch (err: any) {
      console.error("Error fetching order:", err);

      if (err.message?.includes("not found")) {
        return res.status(404).json({
          error: `Order with ID ${req.params.id} not found`,
        });
      }
      res.status(500).json({
        error: "Failed to fetch order",
      });
    }
  });

  app.post("/api/order", async (req: Request, res: Response) => {
    try {
      const createDto = plainToInstance(OrdersCreateDto, req.body);
      const order = await orderController.create(createDto);
      res.status(201).json(order);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const job = await orderController.bulkCreate(req.body.orders);

      res.status(201).json({
        data: job,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create batch orders" });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

main()
  .then(() => console.log("No issue"))
  .catch((error) => console.log("This is error: ", error));
