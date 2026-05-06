import { Router, type IRouter } from "express";
import healthRouter from "./health";
import restaurantsRouter from "./restaurants";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import featuredRouter from "./featured";
import adminRouter from "./admin";
import utilsRouter from "./utils";

const router: IRouter = Router();

router.use(healthRouter);
router.use(restaurantsRouter);
router.use(categoriesRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(featuredRouter);
router.use(adminRouter);
router.use(utilsRouter);

export default router;
