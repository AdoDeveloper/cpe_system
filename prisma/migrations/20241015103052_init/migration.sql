-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "dui" TEXT NOT NULL,
    "cpe_hash" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "anexo" TEXT NOT NULL,
    "fecha_contrato" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo_pago" TEXT NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoServicio" (
    "contratoId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,

    CONSTRAINT "ContratoServicio_pkey" PRIMARY KEY ("contratoId","servicioId")
);

-- CreateTable
CREATE TABLE "EquipoCPE" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "img_equipo" TEXT NOT NULL,
    "nombre_equipo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "EquipoCPE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigCPE" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "user_antena" TEXT NOT NULL,
    "pass_antena" TEXT NOT NULL,
    "ip_antena" TEXT NOT NULL,
    "user_router" TEXT NOT NULL,
    "pass_admin_router" TEXT NOT NULL,
    "ssid" TEXT NOT NULL,
    "pass_pin_router" TEXT NOT NULL,
    "pass_wifi_router" TEXT NOT NULL,
    "lat" TEXT NOT NULL,
    "clong" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "cpe_antenaId" INTEGER NOT NULL,
    "cpe_routerId" INTEGER NOT NULL,

    CONSTRAINT "ConfigCPE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" SERIAL NOT NULL,
    "tipocc" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_cliente" INTEGER,
    "id_factura" INTEGER,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "id_cliente" INTEGER NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleFactura" (
    "id" SERIAL NOT NULL,
    "id_factura" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetalleFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoCliente" (
    "id" SERIAL NOT NULL,
    "id_factura" INTEGER NOT NULL,
    "anexo" TEXT NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "concepto" TEXT NOT NULL,

    CONSTRAINT "PagoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_hash_key" ON "Cliente"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_hash_key" ON "Servicio"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoCPE_hash_key" ON "EquipoCPE"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigCPE_hash_key" ON "ConfigCPE"("hash");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoServicio" ADD CONSTRAINT "ContratoServicio_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoServicio" ADD CONSTRAINT "ContratoServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigCPE" ADD CONSTRAINT "ConfigCPE_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigCPE" ADD CONSTRAINT "ConfigCPE_cpe_antenaId_fkey" FOREIGN KEY ("cpe_antenaId") REFERENCES "EquipoCPE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigCPE" ADD CONSTRAINT "ConfigCPE_cpe_routerId_fkey" FOREIGN KEY ("cpe_routerId") REFERENCES "EquipoCPE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_id_factura_fkey" FOREIGN KEY ("id_factura") REFERENCES "Factura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleFactura" ADD CONSTRAINT "DetalleFactura_id_factura_fkey" FOREIGN KEY ("id_factura") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCliente" ADD CONSTRAINT "PagoCliente_id_factura_fkey" FOREIGN KEY ("id_factura") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCliente" ADD CONSTRAINT "PagoCliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
