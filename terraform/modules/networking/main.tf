module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "6.0.0"

  name            = "book-store-vpc"
  cidr            = var.cidr_block
  azs             = var.availability_zones
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnet_ips

  enable_nat_gateway = true
  enable_vpn_gateway = false
  single_nat_gateway = true

  tags = {
    Name = "book-store-vpc"
  }
}
