import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCollectionsAndClothes1793947904499 implements MigrationInterface {
    name = 'CreateCollectionsAndClothes1793947904499'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."clothes_size_enum" AS ENUM('XS', 'S', 'M', 'L', 'XL')`);
        await queryRunner.query(`CREATE TABLE "clothes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(150) NOT NULL, "slug" character varying(200) NOT NULL, "price" numeric(10,2) NOT NULL, "size" "public"."clothes_size_enum" NOT NULL, "material" character varying(100) NOT NULL, "color" character varying(50) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "collection_id" uuid NOT NULL, CONSTRAINT "CHK_clothes_positive_price" CHECK ("price" > 0), CONSTRAINT "PK_c73aa6c72fd4b3213bfcdc8739b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "collections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "season" character varying(40) NOT NULL, CONSTRAINT "UQ_ed225078e8bf65b448b69105b45" UNIQUE ("name"), CONSTRAINT "PK_21c00b1ebbd41ba1354242c5c4e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "clothes" ADD CONSTRAINT "FK_c335a778290c1b9add1fdf1b022" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clothes" DROP CONSTRAINT "FK_c335a778290c1b9add1fdf1b022"`);
        await queryRunner.query(`DROP TABLE "collections"`);
        await queryRunner.query(`DROP TABLE "clothes"`);
        await queryRunner.query(`DROP TYPE "public"."clothes_size_enum"`);
    }

}
