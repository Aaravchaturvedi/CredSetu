-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "friend_name" VARCHAR(120) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "is_repaid" BOOLEAN NOT NULL DEFAULT false,
    "receipt_image_url" VARCHAR(2048),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "otp_codes_phone_number_expires_at_idx" ON "otp_codes"("phone_number", "expires_at");

-- CreateIndex
CREATE INDEX "loans_user_id_due_date_idx" ON "loans"("user_id", "due_date");

-- CreateIndex
CREATE INDEX "loans_user_id_is_repaid_due_date_idx" ON "loans"("user_id", "is_repaid", "due_date");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
