const ProductAuth = artifacts.require("ProductAuth");

module.exports = function (deployer) {
  deployer.deploy(ProductAuth);
};