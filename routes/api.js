const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');

// @route   GET /api/mentors
// @desc    Get all users acting as mentors
router.get('/mentors', async (req, res) => {
    try {
        const mentors = await User.find();
        res.json(mentors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   POST /api/sessions/book
// @desc    Book a session and lock credits in escrow
router.post('/sessions/book', async (req, res) => {
    try {
        const { learnerId, mentorId, baseAmount } = req.body;
        
        const platformFee = Math.floor(baseAmount * 0.10); // 10% fee
        const totalLocked = baseAmount + platformFee;

        // 1. Validate Learner has enough credits
        const learner = await User.findById(learnerId);
        if (!learner) return res.status(404).json({ error: "Learner not found" });
        if (learner.creditBalance < totalLocked) {
            return res.status(400).json({ error: "Insufficient credits to cover session and platform fee." });
        }

        // 2. Create Session
        const session = new Session({
            learner: learnerId,
            mentor: mentorId,
            status: 'active',
            escrowAmount: baseAmount,
            platformFee: platformFee,
            totalLocked: totalLocked
        });
        await session.save();

        // 3. Deduct from Learner and move to Escrow
        learner.creditBalance -= totalLocked;
        learner.escrowBalance += totalLocked;
        await learner.save();

        // 4. Record Transaction
        await Transaction.create({
            user: learnerId,
            type: 'escrow_lock',
            amount: -totalLocked,
            description: `Locked ${totalLocked} CR in Escrow for session`,
            relatedSession: session._id
        });

        res.status(201).json({ message: "Session booked and credits locked.", session });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   POST /api/sessions/complete
// @desc    Complete a session and release funds
router.post('/sessions/complete', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        const session = await Session.findById(sessionId);
        if (!session || session.status !== 'active') {
            return res.status(400).json({ error: "Valid active session not found" });
        }

        const learner = await User.findById(session.learner);
        const mentor = await User.findById(session.mentor);

        // 1. Release from Learner's Escrow
        learner.escrowBalance -= session.totalLocked;
        await learner.save();

        // 2. Add to Mentor's Available Balance
        mentor.creditBalance += session.escrowAmount;
        mentor.totalSessions += 1;
        await mentor.save();

        // 3. Update Session
        session.status = 'completed';
        session.completedAt = Date.now();
        await session.save();

        // 4. Record Transactions
        await Transaction.create([
            {
                user: learner._id,
                type: 'escrow_release',
                amount: 0, 
                description: `Escrow released. Paid ${session.escrowAmount} CR to mentor.`,
                relatedSession: session._id
            },
            {
                user: mentor._id,
                type: 'payment',
                amount: session.escrowAmount,
                description: `Payment received for session`,
                relatedSession: session._id
            }
        ]);

        res.json({ message: "Session completed, funds released to Mentor." });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
