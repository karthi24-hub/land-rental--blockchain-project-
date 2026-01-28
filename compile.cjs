const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractPath = path.resolve(__dirname, 'contracts', 'RentalAgreement.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'RentalAgreement.sol': {
            content: source,
        },
    },
    settings: {
        evmVersion: 'paris',
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode'],
            },
        },
    },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
    output.errors.forEach((err) => {
        console.error(err.formattedMessage);
    });
}

const contract = output.contracts['RentalAgreement.sol']['RentalAgreement'];

fs.writeFileSync(
    path.resolve(__dirname, 'metadata.json'),
    JSON.stringify({
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
    }, null, 2)
);

console.log('Contract compiled successfully! Metadata saved to metadata.json');
