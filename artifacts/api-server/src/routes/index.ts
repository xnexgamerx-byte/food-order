import { Router, type IRouter } from "express";
import healthRouter from "./health";
import restaurantsRouter from "./restaurants";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import featuredRouter from "./featured";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(restaurantsRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(featuredRouter);
router.use(adminRouter);

export default router;
