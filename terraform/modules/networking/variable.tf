variable "cidr_block" {
  type = string

}
variable "availability_zones" {
  type = list(string)
}

variable "public_subnets_ips" {
  type = list(string)

}
variable "private_subnet_ips" {
  type = list(string)
}
