const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Staker Contract', function () {
  let owner
  let alice
  let bob
  let treasury
  let ownerAddress
  let aliceAddress
  let bobAddress
  let treasuryAddress
  let rewardToken
  let staker
  const defaultReward = ethers.utils.parseUnits('100', 18)
  const defaultFee = ethers.utils.parseUnits('100', 3)
  const feePrecision = ethers.utils.parseUnits('1', 9)
  const initialBalance = ethers.utils.parseUnits('10000000', 18)
  before(async function () {
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)
  })
  beforeEach(async function () {
    [owner, alice, bob, treasury] = await ethers.getSigners()
    ownerAddress = await owner.getAddress()
    aliceAddress = await alice.getAddress()
    bobAddress = await bob.getAddress()
    treasuryAddress = await treasury.getAddress()
    const RewardToken = await ethers.getContractFactory('RewardToken')
    const Staker = await ethers.getContractFactory('Staker')
    rewardToken = await RewardToken.deploy(
      'Reward',
      'RWD',
      true,
      defaultReward,
      defaultFee
    )
    await rewardToken.deployed()
    staker = await Staker.deploy(rewardToken.address, treasuryAddress)
    await staker.deployed()
    await rewardToken.connect(owner).mint(
      staker.address,
      initialBalance
    )
    await rewardToken.connect(owner).mint(
      aliceAddress,
      initialBalance
    )
  })
  it('should initialize correct parameters', async function () {
    expect(await staker.treasury()).to.equal(treasuryAddress)
    expect(await staker.rewardToken()).to.equal(rewardToken.address)
    expect(await rewardToken.balanceOf(staker.address)).to.equal(
      initialBalance
    )
    expect(await rewardToken.balanceOf(aliceAddress)).to.equal(
      initialBalance
    )
    expect(await rewardToken.feeStatus()).to.equal(true)
    expect(await rewardToken.rewardRate()).to.equal(defaultReward)
    expect(await rewardToken.feeRate()).to.equal(defaultFee)
  })
  describe('RewardToken Privilege', function () {
    it('should update the fee status - owner', async function () {
      expect(await rewardToken.feeStatus()).to.equal(true)
      await rewardToken.flipFeeStatus()
      expect(await rewardToken.feeStatus()).to.equal(false)
    })
    it('should not update the fee status - alice', async function () {
      await expect(rewardToken.connect(alice).flipFeeStatus()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should update the reward rate - owner', async function () {
      expect(await rewardToken.rewardRate()).to.equal(defaultReward)
      await rewardToken.setRewardRate(ethers.utils.parseUnits('10', 18))
      expect(await rewardToken.rewardRate()).to.equal(
        ethers.utils.parseUnits('10', 18)
      )
    })
    it('should not update the reward rate - alice', async function () {
      await expect(
        rewardToken.connect(alice).setRewardRate(
          ethers.utils.parseUnits('10', 18)
        )
      ).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should update the fee rate - owner', async function () {
      expect(await rewardToken.feeRate()).to.equal(defaultFee)
      await rewardToken.setFeeRate(ethers.utils.parseUnits('10', 3))
      expect(await rewardToken.feeRate()).to.equal(
        ethers.utils.parseUnits('10', 3)
      )
    })
    it('should not update the fee rate - alice', async function () {
      await expect(
        rewardToken.connect(alice).setFeeRate(
          ethers.utils.parseUnits('10', 3)
        )
      ).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
    it('should mint token - owner', async function () {
      expect(await rewardToken.balanceOf(bobAddress)).to.equal(0)
      await rewardToken.mint(bobAddress, defaultReward)
      expect(await rewardToken.balanceOf(bobAddress)).to.equal(defaultReward)
    })
    it('should not mint token - alice', async function () {
      await expect(
        rewardToken.connect(alice).mint(
          bobAddress, defaultReward
        )
      ).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })
  describe('Staker Flow', function () {
    beforeEach(async function () {
      await rewardToken.mint(bobAddress, ethers.utils.parseUnits('20000000', 18))
    })
    it('should deposit - alice', async function () {
      await rewardToken.connect(alice).approve(
        staker.address,
        initialBalance
      )
      await staker.connect(alice).deposit(
        initialBalance
      )
      expect(await rewardToken.balanceOf(aliceAddress)).to.equal(0)
      expect(await rewardToken.balanceOf(staker.address)).to.equal(
        ethers.utils.parseUnits('20000000', 18)
      )
    })
    it('should deposit and charge - alice', async function () {
      await rewardToken.connect(alice).approve(
        staker.address,
        initialBalance
      )
      await staker.connect(alice).deposit(
        initialBalance
      )
      const startBlock = await ethers.provider.getBlockNumber()
      const [, , , unclaimedReward] = await staker.stakers(aliceAddress)
      expect(unclaimedReward).to.equal(0)
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await staker.connect(alice).harvestRewards(false)
      const endBlock = await ethers.provider.getBlockNumber()
      const [, , , unclaimedRewardAfter] = await staker.stakers(aliceAddress)
      expect(unclaimedRewardAfter).to.equal(defaultReward.mul(endBlock - startBlock))
    })
    it('should deposit and harvest - fee disabled - alice', async function () {
      await rewardToken.connect(alice).approve(
        staker.address,
        initialBalance
      )
      await staker.connect(alice).deposit(
        initialBalance
      )
      const startBlock = await ethers.provider.getBlockNumber()
      await rewardToken.flipFeeStatus()
      expect(await rewardToken.balanceOf(aliceAddress)).to.equal(0)
      const [, , , unclaimedReward] = await staker.stakers(aliceAddress)
      expect(unclaimedReward).to.equal(0)
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await staker.connect(alice).harvestRewards(true)
      const endBlock = await ethers.provider.getBlockNumber()
      const [, , , unclaimedRewardAfter] = await staker.stakers(aliceAddress)
      expect(unclaimedRewardAfter).to.equal(0)
      expect(await rewardToken.balanceOf(aliceAddress)).to.equal(
        defaultReward.mul(endBlock - startBlock)
      )
    })
    it('should deposit and harvest - fee enabled - alice', async function () {
      await rewardToken.connect(alice).approve(
        staker.address,
        initialBalance
      )
      await staker.connect(alice).deposit(
        initialBalance
      )
      const startBlock = await ethers.provider.getBlockNumber()
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await staker.connect(alice).harvestRewards(true)
      const endBlock = await ethers.provider.getBlockNumber()
      const allReward = defaultReward.mul(endBlock - startBlock)
      const calculatedFee = allReward.mul(defaultFee).div(feePrecision)
      expect(await rewardToken.balanceOf(aliceAddress)).to.equal(
        allReward.sub(calculatedFee)
      )
      expect(await rewardToken.balanceOf(treasuryAddress)).to.equal(
        calculatedFee
      )
    })
    it('should deposit and withdraw - fee enabled - alice', async function () {
      await rewardToken.connect(alice).approve(
        staker.address,
        initialBalance
      )
      await staker.connect(alice).deposit(
        initialBalance
      )
      const startBlock = await ethers.provider.getBlockNumber()
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await staker.connect(alice).withdraw()
      const endBlock = await ethers.provider.getBlockNumber()
      const allReward = initialBalance.add(defaultReward.mul(endBlock - startBlock))
      const calculatedFee = allReward.mul(defaultFee).div(feePrecision)
      expect(await rewardToken.balanceOf(aliceAddress)).to.equal(
        allReward.sub(calculatedFee)
      )
      expect(await rewardToken.balanceOf(treasuryAddress)).to.equal(
        calculatedFee
      )
    })
    it('should deposit and charge - fee enabled - alice & bob', async function () {
      await rewardToken.connect(alice).approve(
        staker.address,
        initialBalance
      )
      await staker.connect(alice).deposit(
        initialBalance
      )
      const aliceStartBlock = await ethers.provider.getBlockNumber()
      await rewardToken.connect(bob).approve(
        staker.address,
        initialBalance.mul(2)
      )
      await staker.connect(bob).deposit(
        initialBalance.mul(2)
      )
      const bobStartBlock = await ethers.provider.getBlockNumber()
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await staker.connect(alice).harvestRewards(false)
      const endBlock = await ethers.provider.getBlockNumber()
      let aliceReward = defaultReward.mul(bobStartBlock- aliceStartBlock)
      aliceReward = aliceReward.add(defaultReward.mul(endBlock - bobStartBlock).mul(initialBalance).div(initialBalance.mul(3)))
      const [, , , unclaimedRewardAfter] = await staker.stakers(aliceAddress)
      expect(unclaimedRewardAfter).to.equal(aliceReward)
    })
    it('should deposit and withdraw - fee disabled - alice & bob', async function () {
      await rewardToken.flipFeeStatus()
      await rewardToken.connect(alice).approve(
        staker.address,
        initialBalance
      )
      await staker.connect(alice).deposit(
        initialBalance
      )
      const aliceStartBlock = await ethers.provider.getBlockNumber()
      await rewardToken.connect(bob).approve(
        staker.address,
        initialBalance.mul(2)
      )
      await staker.connect(bob).deposit(
        initialBalance.mul(2)
      )
      const bobStartBlock = await ethers.provider.getBlockNumber()
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await ethers.provider.send('evm_mine', [])
      await staker.connect(alice).withdraw()
      const aliceEndBlock = await ethers.provider.getBlockNumber()
      await staker.connect(bob).harvestRewards(false)
      const bobEndBlock = await ethers.provider.getBlockNumber()
      let aliceReward = defaultReward.mul(bobStartBlock- aliceStartBlock)
      aliceReward = aliceReward.add(defaultReward.mul(aliceEndBlock - bobStartBlock).mul(initialBalance).div(initialBalance.mul(3)))
      let bobReward = defaultReward.mul(bobEndBlock- aliceEndBlock)
      bobReward = bobReward.add(defaultReward.mul(aliceEndBlock - bobStartBlock).mul(initialBalance.mul(2)).div(initialBalance.mul(3)))
      const [, , , unclaimedRewardBob] = await staker.stakers(bobAddress)
      expect(await rewardToken.balanceOf(aliceAddress)).to.equal(initialBalance.add(aliceReward))
      expect(unclaimedRewardBob).to.equal(bobReward)
    })
  })
})
