-- CreateEnum
CREATE TYPE "CharacterOperatorPermission" AS ENUM ('SET_HANDLE', 'SET_SOCIAL_TOKEN', 'GRANT_OPERATOR_PERMISSIONS', 'GRANT_OPERATORS_FOR_NOTE', 'SET_CHARACTER_URI', 'SET_LINKLIST_URI', 'LINK_CHARACTER', 'UNLINK_CHARACTER', 'CREATE_THEN_LINK_CHARACTER', 'LINK_NOTE', 'UNLINK_NOTE', 'LINK_ERC721', 'UNLINK_ERC721', 'LINK_ADDRESS', 'UNLINK_ADDRESS', 'LINK_ANY_URI', 'UNLINK_ANY_URI', 'LINK_LINKLIST', 'UNLINK_LINKLIST', 'SET_LINK_MODULE_FOR_CHARACTER', 'SET_LINK_MODULE_FOR_NOTE', 'SET_LINK_MODULE_FOR_LINKLIST', 'SET_MINT_MODULE_FOR_NOTE', 'SET_NOTE_URI', 'LOCK_NOTE', 'DELETE_NOTE', 'POST_NOTE_FOR_CHARACTER', 'POST_NOTE_FOR_ADDRESS', 'POST_NOTE_FOR_LINKLIST', 'POST_NOTE_FOR_NOTE', 'POST_NOTE_FOR_ERC721', 'POST_NOTE_FOR_ANY_URI', 'POST_NOTE');

-- CreateTable
CREATE TABLE "event_point" (
    "event_name" TEXT NOT NULL,
    "block_number" INTEGER NOT NULL,
    "transaction_hash" TEXT,

    CONSTRAINT "event_point_pkey" PRIMARY KEY ("event_name")
);

-- CreateTable
CREATE TABLE "op_sign_user" (
    "address" TEXT NOT NULL,
    "csb_spent" TEXT NOT NULL DEFAULT '0',
    "csb_recharged" TEXT NOT NULL DEFAULT '0',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "op_sign_user_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "character_operator" (
    "character_id" INTEGER NOT NULL,
    "operator" TEXT NOT NULL,
    "permissions" "CharacterOperatorPermission"[],
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "block_number" INTEGER NOT NULL,
    "log_index" INTEGER NOT NULL,
    "updated_transaction_hash" TEXT NOT NULL,
    "updated_block_number" INTEGER NOT NULL,
    "updated_log_index" INTEGER NOT NULL,

    CONSTRAINT "character_operator_pkey" PRIMARY KEY ("character_id","operator")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_point_event_name_key" ON "event_point"("event_name");

-- CreateIndex
CREATE INDEX "event_point_event_name_idx" ON "event_point"("event_name");

-- CreateIndex
CREATE UNIQUE INDEX "op_sign_user_address_key" ON "op_sign_user"("address");

-- CreateIndex
CREATE INDEX "op_sign_user_csb_spent_idx" ON "op_sign_user"("csb_spent");

-- CreateIndex
CREATE INDEX "op_sign_user_csb_recharged_idx" ON "op_sign_user"("csb_recharged");

-- CreateIndex
CREATE INDEX "op_sign_user_created_at_idx" ON "op_sign_user"("created_at" DESC);

-- CreateIndex
CREATE INDEX "op_sign_user_updated_at_idx" ON "op_sign_user"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "character_operator_character_id_idx" ON "character_operator"("character_id");

-- CreateIndex
CREATE INDEX "character_operator_operator_idx" ON "character_operator"("operator");

-- CreateIndex
CREATE INDEX "character_operator_character_id_operator_idx" ON "character_operator"("character_id", "operator");

-- CreateIndex
CREATE INDEX "character_operator_permissions_idx" ON "character_operator"("permissions");

-- CreateIndex
CREATE INDEX "character_operator_created_at_idx" ON "character_operator"("created_at" DESC);

-- CreateIndex
CREATE INDEX "character_operator_updated_at_idx" ON "character_operator"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "character_operator_block_number_idx" ON "character_operator"("block_number" DESC);

-- CreateIndex
CREATE INDEX "character_operator_updated_block_number_idx" ON "character_operator"("updated_block_number" DESC);

-- CreateIndex
CREATE INDEX "character_operator_log_index_idx" ON "character_operator"("log_index" DESC);

-- CreateIndex
CREATE INDEX "character_operator_updated_log_index_idx" ON "character_operator"("updated_log_index" DESC);

-- CreateIndex
CREATE INDEX "character_operator_transaction_hash_idx" ON "character_operator"("transaction_hash");

-- CreateIndex
CREATE INDEX "character_operator_updated_transaction_hash_idx" ON "character_operator"("updated_transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "character_operator_character_id_operator_key" ON "character_operator"("character_id", "operator");
